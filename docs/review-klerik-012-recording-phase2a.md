# Review Klerik 012 — Recording Phase 2a: Web Speech Transcription

**Reviewer:** Klerik
**Scope:** `transcription-service.ts`, `TranscriptView.tsx`, `TranscriptionSettings.tsx`, `ConversationView.tsx`, `styles.css`
**Date:** 2026-07-08
**Repo:** `agent-projects/barcelona-relocation-dashboard/app`

## Verdict: ⚠️ NEEDS_CHANGES

The architecture is clean and the build passes, but there is one **correctness bug** that breaks the live transcript during normal use, plus two minor issues. Phase 2a is not merge-ready until the segment-id collision is fixed.

---

## What was verified (checklist)

| Check | Result |
|-------|--------|
| Web Speech API implemented with restart-on-silence | ✅ present (with bug, see C1) |
| `TranscriptSegment` shape matches `move-map.ts` canonical type | ✅ exact match |
| `ConversationView` auto-starts transcription when recording reaches `"done"` | ✅ correct |
| No leaks — recognition stopped on unmount | ✅ handled |
| `TranscriptionSettings` persists choice | ✅ via `localStorage` |
| Build passes | ✅ `tsc -b && vite build` clean (1805 modules, no TS errors) |

---

## Findings

### C1 — CRITICAL: Segment ID collides across restarts (transcript corruption)

**File:** `transcription-service.ts`, lines 97–124 (`onresult`)

Segment ids are derived from `e.resultIndex`:

```ts
const id = `seg-${i}`;   // i = e.resultIndex
```

On `onend`, `WebSpeechTranscription` restarts recognition via `scheduleRestart()` (lines 137–146, 176–188) to survive natural pauses — this is the core "restart-on-silence" behavior. But each `recognition.start()` begins a **fresh internal result set**, so `resultIndex` **resets to 0** on the new session.

`ConversationView.onSegment` (lines 185–198) dedupes/updates by `seg.id`:

```ts
const idx = next.findIndex((s) => s.id === seg.id);
```

So the first result after *every* silence gap (`seg-0`) re-uses the id of the first segment captured in the *whole session* and **overwrites it**, instead of appending a new line. Concretely:

- Say the user speaks, pauses 250ms+, speaks again. The post-pause `seg-0` overwrites the session's original first line.
- If the post-pause result has `resultIndex > 0` but fewer total results than the first session, ids `seg-1…seg-N` may also collide and shift/overwrite existing lines.

Because real speech contains frequent natural pauses, this means the live transcript is corrupted on essentially every utterance boundary. This defeats the purpose of restart-on-silence and must be fixed before approval.

**Fix:** Use a monotonically increasing counter on the service instance (reset at `startTranscript`) for `seg-${counter++}`, independent of `resultIndex`. Keep `resultIndex` only for slicing the results array. This guarantees globally-unique ids for the session and correct append/merge behavior in `ConversationView`.

### C2 — MINOR: Interim `endOffset` is wrong (cosmetic)

**File:** `transcription-service.ts`, lines 113–121

For interim results, `endOffset` is set equal to `startOffset`. Since `TranscriptView` only displays `startOffset` as a timestamp (line 44, `formatOffset(seg.startOffset)`), this is cosmetic and never rendered. Still, `endOffset` should track the actual interim end time for downstream consumers (e.g. future time-range exports). Low priority — can ride along with C1.

### C3 — MINOR: `startTranscript` not guarded against double `rec.start()` race

**File:** `transcription-service.ts`, lines 181–186 (`scheduleRestart`)

`scheduleRestart` guards against the "already started" exception by catching and re-scheduling — acceptable. However, `onresult`/`onend` can race on rapid toggle. The `stopTranscript` path nulls `recognition.onend` and clears the timer (lines 158–174), which correctly prevents a restart after stop. This is fine; noting only that the 250ms restart delay is a fixed magic number with no jitter — acceptable for Phase 2a, revisit if browsers rate-limit restarts.

---

## What is correct (good work)

- **Type fidelity:** `TranscriptSegment` emitted by the service is byte-for-byte the canonical `move-map.ts` type (`id, speaker, text, startOffset, endOffset, isFinal`). The service re-exports the canonical type so there is a single source of truth (line 7). ✅
- **Auto-start wiring:** `ConversationView` (lines 213–222) watches `recordingState`; when it transitions `→ "done"` (emitted by `useRecording` after the blob is saved — confirmed in `useRecording.ts` line 75) it calls `startTranscription()`. When `→ "idle"` it calls `stopTranscription()`. Exactly the required behavior. ✅
- **Restart-on-silence:** Implemented correctly in intent (`onend` → `scheduleRestart` while `running`), with `no-speech`/`aborted` errors intentionally swallowed to let `onend` drive the restart (lines 126–135, 137–146). The mechanism is sound; only the id scheme (C1) undermines it.
- **No leaks:** `stopTranscript` clears the restart timer, nulls `onend`, and calls `recognition.stop()`. The unmount `useEffect` in `ConversationView` (lines 225–230) also stops the transcriber. `useRecording` likewise releases the mic on unmount. ✅
- **Persistence:** `TranscriptionSettings` reads/writes `localStorage` key `barcelona-relocation-transcription-method` (lines 5, 10, 18–25) and re-hydrates on mount (lines 40–45). Whisper option is correctly disabled until Phase 2b (lines 48–51, 78). ✅
- **Styles:** All referenced classes exist in `styles.css` — `.transcript-view`, `.transcript-segment`, `.transcript-segment.interim`, `.transcript-speaker`, `.transcript-text`, `.transcript-time`, `.transcript-empty`, `.transcript-area`, `.transcription-status-chip`, plus the full `TranscriptionSettings` set. `aria-live` is correctly toggled by `isLive` in `TranscriptView`. ✅
- **Build:** Clean `tsc -b && vite build`, no type errors, dist emitted. ✅

---

## Required actions before approval

1. **[C1] Fix segment-id generation** in `transcription-service.ts` to use a monotonic per-session counter instead of `resultIndex`. (Blocking.)
2. **[C2]** (Optional, bundle with C1) Set a sensible `endOffset` for interim segments.

After C1 is fixed, re-run `npm run build` and re-submit for review. No other changes required.

## Sign-off

- Build: ✅ PASS
- Functionality (excluding C1): ✅
- **Phase 2a verdict: NEEDS_CHANGES — blocked on C1 (segment-id collision on restart-on-silence).**
