// Transcript → structured data parser (Phase 3)
// Calls the local LM Studio OpenAI-compatible chat endpoint to extract
// action items, decisions, key questions, and a summary from a transcript.

import type { ParsedTranscript, ParsedTranscriptItem } from "../types/move-map";

const LM_STUDIO_URL = "http://localhost:20128/v1/chat/completions";
const MAX_RETRIES = 3;

// Models to try, in order of preference. 9router exposes multiple cx/gpt models.
const MODEL_CANDIDATES = ["cx/gpt-5.4-mini", "cx/gpt-5.4"];

const SYSTEM_PROMPT = `You are a transcript analyst for a family relocation project (Barcelona move).
Given a conversation transcript, extract structured, actionable data.

Return a JSON object with exactly these keys:
- "summary": a concise 2-4 sentence summary of the conversation.
- "actionItems": an array of concrete next-step action items. Each item is an object with "text" (string) and optional "owner" (string, one of "Nate", "Shae", or "shared").
- "decisions": an array of decisions or conclusions reached. Each item is an object with "text" (string).
- "keyQuestions": an array of open/unresolved questions still needing an answer. Each item is an object with "text" (string).

Guidelines:
- Only include items that are clearly present in the transcript.
- Keep each item a single short sentence.
- Do not invent details. If a category is empty, return an empty array.
- Respond ONLY with the JSON object (no markdown, no commentary).
The transcript is labeled by speaker (each line is prefixed with "Nate:" or "Shae:"). Use these labels to set the "owner" field on action items.`;

function emptyParsed(rawTranscript: string): ParsedTranscript {
  return {
    summary: "",
    actionItems: [],
    decisions: [],
    keyQuestions: [],
    rawTranscript,
  };
}

type RawItem = { text?: unknown; owner?: unknown };

function normalizeItems(raw: unknown): ParsedTranscriptItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((entry): entry is RawItem => entry != null && typeof entry === "object")
    .map((entry) => {
      const text = typeof entry.text === "string" ? entry.text.trim() : "";
      const owner = typeof entry.owner === "string" ? entry.owner.trim() : undefined;
      return {
        type: "summary_point" as const,
        text,
        confidence: "high" as const,
        owner: owner || undefined,
        sourceSegmentIds: [],
      };
    })
    .filter((item) => item.text.length > 0);
}

function mapToTyped(
  items: ParsedTranscriptItem[],
  type: ParsedTranscriptItem["type"],
): ParsedTranscriptItem[] {
  return items.map((item) => ({ ...item, type }));
}

/**
 * Parse a raw transcript into structured data via the local LLM.
 * Retries up to MAX_RETRIES times, then falls back to an empty result.
 */
export async function parseTranscript(rawText: string): Promise<ParsedTranscript> {
  const trimmed = (rawText ?? "").trim();
  if (!trimmed) return emptyParsed(rawText ?? "");

  let lastError: unknown = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const result = await tryParseOnce(trimmed);
      return result;
    } catch (err) {
      lastError = err;
      // Brief backoff between attempts.
      if (attempt < MAX_RETRIES - 1) {
        await new Promise((resolve) => setTimeout(resolve, 600));
      }
    }
  }

  console.warn(
    "parseTranscript: all attempts failed — surfacing error to caller.",
    lastError,
  );
  // Distinguish a genuine failure (9router down / bad response) from an
  // intentionally empty parse. Empty *input* is handled earlier and returns
  // emptyParsed without error; reaching here means the LLM call itself failed,
  // so we throw and let the UI show a retryable error state.
  throw lastError instanceof Error
    ? lastError
    : new Error("LLM parse failed for all models");
}

async function tryParseOnce(rawText: string): Promise<ParsedTranscript> {
  let lastModelError: unknown = null;

  // Try each candidate model; if every model fails, retry once without a model field.
  const attempts: Array<{ model?: string }> = [
    ...MODEL_CANDIDATES.map((model) => ({ model })),
    { model: undefined },
  ];

  for (const { model } of attempts) {
    try {
      const body: Record<string, unknown> = {
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: rawText },
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
      };
      if (model) body.model = model;

      const res = await fetch(LM_STUDIO_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        lastModelError = new Error(`LLM HTTP ${res.status}: ${errText}`);
        continue; // try next model
      }

      const json = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = json.choices?.[0]?.message?.content;
      if (typeof content !== "string") {
        lastModelError = new Error("LLM response missing message content");
        continue;
      }

      const parsed = JSON.parse(content) as {
        summary?: unknown;
        actionItems?: unknown;
        decisions?: unknown;
        keyQuestions?: unknown;
      };

      const summary =
        typeof parsed.summary === "string" ? parsed.summary.trim() : "";
      const actionItems = mapToTyped(
        normalizeItems(parsed.actionItems),
        "action_item",
      );
      const decisions = mapToTyped(normalizeItems(parsed.decisions), "decision");
      const keyQuestions = mapToTyped(
        normalizeItems(parsed.keyQuestions),
        "question",
      );

      return {
        summary,
        actionItems,
        decisions,
        keyQuestions,
        rawTranscript: rawText,
      };
    } catch (err) {
      lastModelError = err;
      // network / parse error — try next model
    }
  }

  throw lastModelError ?? new Error("LLM parse failed for all models");
}
