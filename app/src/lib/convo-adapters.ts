import type { ConvoDecision, ConvoTask } from "../types/convo";
import type { ConversationContext, ParsedTranscript, ParsedTranscriptItem, RecordedAudio } from "../types/move-map";

type ArchivedSession = {
  id: number;
  label: string;
  endedAt: string;
  parsedTranscript?: ParsedTranscript | null;
  recording?: RecordedAudio | null;
  taskContext?: ConversationContext | null;
};

function buildStableConvoId(prefix: string, sessionId: number, itemIndex: number) {
  return `${prefix}-${sessionId}-${itemIndex}`;
}

function toIsoDateTime(value: string | undefined) {
  const parsed = value ? Date.parse(value) : Number.NaN;
  return Number.isNaN(parsed) ? new Date(0).toISOString() : new Date(parsed).toISOString();
}

function hasText(item: ParsedTranscriptItem | null | undefined): item is ParsedTranscriptItem & { text: string } {
  return !!item && typeof item.text === "string" && item.text.trim().length > 0;
}

function mapConfidenceToPriority(confidence: ParsedTranscriptItem["confidence"]): ConvoTask["priority"] {
  return confidence === "high" ? "high" : confidence === "low" ? "low" : "medium";
}

function mapConfidenceLevel(confidence: ParsedTranscriptItem["confidence"]): ConvoDecision["confidence_level"] {
  return confidence === "high" ? "high" : confidence === "low" ? "low" : "medium";
}

export function toConvoTaskDraftsFromArchivedSession(session: ArchivedSession, goalId: string): ConvoTask[] {
  const createdAt = toIsoDateTime(session.endedAt);
  const summary = session.parsedTranscript?.summary?.trim() ?? "";
  const items = session.parsedTranscript?.actionItems ?? [];

  return items
    .filter(hasText)
    .map((item, itemIndex) => ({
      id: buildStableConvoId("convo-task", session.id, itemIndex),
      goal_id: goalId,
      title: item.text.trim(),
      description: "",
      notes: summary,
      track: "conversation",
      status: "not_started",
      priority: mapConfidenceToPriority(item.confidence),
      owner: item.owner ?? item.relatedSpeaker ?? "",
      is_roadmap_requirement: false,
      blocks_phase_progress: false,
      dependency_ids: [],
      follow_up_task_ids: [],
      conversation_prompt: item.text.trim(),
      generated_from_conversation: true,
      related_conversation_ids: [],
      discussion_status: "discussed",
      work_mode: "execute",
      readiness_status: "ready_to_execute",
      research_status: "not_started",
      evidence_links: [],
      related_risk_ids: [],
      related_document_ids: [],
      related_idea_ids: [],
      source: "conversation_generated",
      approval_status: "draft",
      created_at: createdAt,
      updated_at: createdAt,
      archived: false,
    }));
}

export function toConvoDecisionDraftsFromArchivedSession(session: ArchivedSession, goalId: string): ConvoDecision[] {
  const createdAt = toIsoDateTime(session.endedAt);
  const summary = session.parsedTranscript?.summary?.trim() ?? "";
  const items = session.parsedTranscript?.decisions ?? [];

  return items
    .filter(hasText)
    .map((item, itemIndex) => ({
      id: buildStableConvoId("convo-decision", session.id, itemIndex),
      goal_id: goalId,
      title: item.text.trim(),
      question: item.text.trim(),
      status: "open",
      decision: item.text.trim(),
      rationale: summary,
      owner: item.owner ?? item.relatedSpeaker ?? undefined,
      partner_positions: {},
      shared_values_involved: [],
      concerns: [],
      non_negotiables: [],
      tradeoffs: [],
      confidence_level: mapConfidenceLevel(item.confidence),
      agreement_status: "not_aligned",
      blocks_phase_progress: false,
      related_task_ids: [],
      related_risk_ids: [],
      related_idea_ids: [],
      related_document_ids: [],
      related_conversation_ids: [],
      discussion_status: "discussed",
      work_mode: "decide",
      readiness_status: "ready_to_decide",
      evidence_needed: [],
      evidence_links: [],
      source: "conversation_generated",
      approval_status: "draft",
      created_at: createdAt,
      updated_at: createdAt,
      archived: false,
    }));
}
