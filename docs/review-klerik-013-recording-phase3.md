# Review — Klerik #013 · Recording Phase 3 (Transcript Parsing & Cross-Page Dispatch)

**Reviewer:** Klerik
**Date:** 2026-07-08
**Scope:** `transcript-parser.ts`, `TranscriptParserPanel.tsx`, `ConversationView.tsx` (dispatch + archive extension), `styles.css`
**Result of build:** `tsc -b && vite build` → exit 0 (1807 modules, no type errors)

## Verdict: NEEDS_CHANGES

Strong, well-structured implementation. Four of six checklist items are fully satisfied. One real defect (silent draft data-loss on dispatch) must be fixed before this can pass — it is a small, localized change. Everything else is approved.

---

## Checklist

| Check | Status | Notes |
|---|---|---|
| LLM errors handled gracefully (retry + fallback) | ✅ PASS | `parseTranscript` retries `MAX_RETRIES=3` with 600 ms backoff, then returns an empty parse instead of throwing. `tryParseOnce` additionally rotates through `MODEL_CANDIDATES` + a no-model fallback before failing. |
| Cross-page dispatch writes to correct localStorage keys | ⚠️ PARTIAL | Keys are correct (`move-map:tasks-view`, `move-map:decisions-view` — verified against `TasksView.tsx:26` and `DecisionsView.tsx:26`), **but** the write clobbers sibling `draft` state in the same key. See Issue A. |
| `notifyMoveMapStateChanged` called after dispatch | ✅ PASS | Called in both `sendToTasks` (line 409) and `sendToDecisions` (line 445), only on successful persist. |
| `ArchivedSession` extended with `parsedTranscript` + `recording` | ✅ PASS | Type extended in `ConversationView.tsx:81-82`; `end()` populates both (lines 304-305). `loadStoredSessions`/`saveStoredSessions` persist them via JSON. Archive detail renders parsed sections (lines 763-800). |
| No XSS in rendering parsed content | ✅ PASS | No `dangerouslySetInnerHTML` anywhere in `src`. All parsed text rendered as JSX children (`{item.text}`, `{parsed.summary}`) → React auto-escapes. |
| Build passes | ✅ PASS | `npm run build` exit 0. |

---

## Issue A (must fix) — Dispatch drops the consumer's `draft` from the shared key

**Severity:** Minor, but real data-loss. Single-method fix.

`TasksView` and `DecisionsView` store `{ tasks, draft }` / `{ decisions, draft }` under the same key. Their `useEffect` persists `draft` on every change, so an in-progress (unsaved) draft lives in that key between route visits.

`sendToTasks` / `sendToDecisions` rebuild the object as `{ tasks: next }` / `{ decisions: next }` only, so any previously persisted `draft` is overwritten with `undefined`/absent.

Repro path:
1. Open Tasks view, type a draft, navigate away (draft written to `move-map:tasks-view`).
2. In Conversation view, dispatch a parsed action item → `sendToTasks` writes `{ tasks: [...] }`, **dropping the draft**.
3. Return to Tasks view → draft is gone.

**Fix:** preserve the existing `draft` when writing. Example for `sendToTasks`:

```ts
const existing = raw ? (JSON.parse(raw) as { tasks?: unknown[]; draft?: unknown }) : null;
current = Array.isArray(existing?.tasks) ? existing!.tasks : [];
const draft = existing?.draft; // preserve in-progress draft
...
window.localStorage.setItem(KEY, JSON.stringify({ tasks: next, draft }));
```

Apply the same pattern to `sendToDecisions` (`draft` from the decisions key).

---

## Minor observations (non-blocking, optional)

- **`end()` recording capture** (`ConversationView.tsx:286-296`): grabs the *most recent* audio meta globally, not the recording tied to this specific session. Acceptable for v1 but could attach the wrong audio if multiple recordings exist. Consider storing the `RecordedAudio` reference from `useRecording` when the session ends.
- **Retry fan-out**: up to `MAX_RETRIES (3) × (MODEL_CANDIDATES (2) + 1 no-model) = 9` LM Studio calls worst-case before fallback. Intended for robustness; just be aware of latency when the endpoint is down.
- **Hardcoded model name** `"deepseek/deepseek-v4-flash"` (line 12): a tag that may not exist in a given LM Studio install. Safe because it falls back to `local-model` then no-model, but worth confirming the preferred model alias matches the user's actual LM Studio load.

---

## Approval gate

Fix Issue A (preserve `draft` on dispatch in both `sendToTasks` and `sendToDecisions`). After that, this Phase 3 work is **APPROVED**.
