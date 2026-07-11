# Klerik Review — 014: Conversation Recording Final (Phases 0–4)

**Reviewer:** Klerik
**Date:** 2026-07-08
**Scope:** Holistic final review of the entire conversation-recording feature across Phases 0–4.
**Verdict:** ✅ **APPROVED** (one error-handling defect found and fixed during review; build green).

> Note on location: the feature files live under
> `agent-projects/barcelona-relocation-dashboard/app/src/...`, not `/Users/nateb/app/...`
> as stated in the brief. All paths below are relative to `app/src`.

---

## Files reviewed

| Layer | File |
|-------|------|
| Recorder | `lib/audio-recorder.ts` |
| Persistence | `lib/audio-store.ts` |
| Transcription | `lib/transcription-service.ts` |
| Parser | `lib/transcript-parser.ts` |
| Events | `lib/state-events.ts` |
| Hook | `hooks/useRecording.ts` |
| UI | `components/RecordingControls.tsx`, `TranscriptView.tsx`, `TranscriptionSettings.tsx`, `TranscriptParserPanel.tsx` |
| View | `views/ConversationView.tsx` |
| Styles | `styles.css` (recording section, lines 676–1015) |
| Types | `types/move-map.ts` (Recording & Transcription block) |
| Dispatch targets | `views/TasksView.tsx`, `views/DecisionsView.tsx`, `lib/live-snapshot.ts` |

---

## 1. Full flow: Record → Save → Transcribe → Parse → Dispatch → Archive

**Verified end-to-end by tracing state transitions:**

- **Record** — `useRecording.startRecording` → `AudioRecorder.start()` requests `getUserMedia`, builds a `MediaRecorder` (webm/opus), collects 250 ms chunks. On stop, `onStop` builds a `RecordedAudio` meta with `dbKey = id` and persists it.
- **Save audio** — `onStop` calls `saveAudio(id, blob)` then `saveAudioMeta(meta)` (IndexedDB, two stores). State machine: `idle → preparing → recording → stopped → done`.
- **Transcribe (Web Speech)** — `ConversationView` watches `recordingState`; on transition to `done` it auto-starts `WebSpeechTranscription`. Segments accumulate in `setSegments`, deduped by `seg.id` with interim→final lock-in. `transcriptText` (useMemo) joins final segments.
- **Parse (LM Studio)** — `handleParse` → `parseTranscript(transcriptText)` POSTs to `http://localhost:1234/v1/chat/completions`, retries 3× across model candidates, normalizes to `ParsedTranscript`.
- **Dispatch** — `sendToTasks` / `sendToDecisions` write to **`move-map:tasks-view`** / **`move-map:decisions-view`** — confirmed byte-identical to the storage keys read by `TasksView.tsx` / `DecisionsView.tsx`. Both functions **merge** into the existing array (preserving the `draft` object, so no draft data loss) and fire `notifyMoveMapStateChanged()` so other views refresh. Field names on dispatched items (`title`, `track`, `owner`, `status`, `due_date`, `notes`, `archived`, etc.) match `EditableTask`/`EditableDecision` exactly.
- **Archive + playback** — `end()` snapshots the most-recent `RecordedAudio` (latest `createdAt`) into the archived session; `ArchiveAudioPlayer` loads the blob from IndexedDB by `dbKey`, creates an object URL, and **revokes it on unmount**.

✅ **Flow is complete and consistent.**

---

## 2. Memory leaks — mic, intervals, object URLs

| Resource | Lifecycle | Status |
|----------|-----------|--------|
| Mic tracks / `MediaStream` | `AudioRecorder.cleanup()` stops all tracks; called in `onstop` and `onerror`. | ✅ |
| `MediaRecorder` | nulled in `cleanup()`; also `useRecording` unmount effect calls `recorderRef.current?.stop()`. | ✅ |
| Duration interval | `useRecording` `useEffect` sets/clear interval keyed on `recordingState`. | ✅ |
| Conversation timer interval | `ConversationView` interval cleared on deps change/unmount. | ✅ |
| Flash timeout | `ConversationView` cleared on `flash` change/unmount. | ✅ |
| Transcriber restart timer | `WebSpeechTranscription.scheduleRestart` timer cleared in `stopTranscript()`. | ✅ |
| SpeechRecognition | `stopTranscript()` nulls `recognition`, disables `onend`, and `ConversationView` unmount effect stops it. | ✅ |
| Object URL (playback) | `ArchiveAudioPlayer` `useEffect` return revokes the URL; guarded by `cancelled` flag. | ✅ |

**One latent concern (not a leak, acceptable):** `useRecording`'s unmount effect calls `recorderRef.current?.stop()` — if a recording is active it finalizes via `onStop` and persists. If `saveAudio`/`saveAudioMeta` is mid-flight at unmount, the async continuation still completes (it's fire-and-forget inside the callback). No dangling handle. ✅

✅ **No resource leaks found.**

---

## 3. Data loss — drafts, IndexedDB metadata + blob consistency

- **Blob + metadata consistency:** both saved in the same `onStop` callback, keyed by the **same `id`** (`dbKey = id`). `ArchiveAudioPlayer` reads `getAudio(recording.dbKey)`; meta and blob share the id, so a meta entry always points at a present blob (and the player shows "Audio file is no longer available" if missing rather than crashing).
- **Delete:** `deleteRecording` clears `recording` from the session and `Promise.allSettled([deleteAudio, deleteAudioMeta])` — both removed together, no orphan blob/meta.
- **Task/Decision drafts preserved:** dispatch merges `tasks`/`decisions` and keeps the existing `draft` object untouched (the target views store `draft` separately and merge logic spreads `...existing`).
- **Archived sessions:** persisted to `localStorage` with a shape-validating loader (`loadStoredSessions`); corrupt/partial entries are dropped safely.
- **`getAllAudioMeta` for archive:** `end()` picks the latest meta; if IndexedDB read throws it falls back to `null` recording (no crash).

⚠️ **Minor behavioral note (not a defect):** `end()` always grabs the *single* most recent recording regardless of which session was recorded. In the current UX the recording starts within the active conversation, so this is correct. If the app later supports multiple recordings per "archive" this would need revisiting — out of scope for this review.

✅ **No data-loss paths found.**

---

## 4. Error handling

| Scenario | Handling | Status |
|----------|----------|--------|
| Mic denied / unavailable | `AudioRecorder.start` catches `getUserMedia` error, resets to `idle`, calls `onError`; `useRecording` maps `NotAllowedError`/`NotFoundError`/`NotReadableError` etc. to friendly messages. | ✅ |
| Recorder hardware error | `media.onerror` cleans up + surfaces `onError`. | ✅ |
| Web Speech unsupported | `startTranscription` checks `isTranscriptionSupported` and sets `transcriptError`. | ✅ |
| Web Speech runtime error | `onError` → `setTranscriptError` + `stopTranscription`. | ✅ |
| No transcript (empty) | `handleParse` guarded by `hasTranscript`; parse button disabled; empty parse shows "LLM did not extract…" empty-state. | ✅ |
| **Parse failed (LM Studio down)** | **FIXED** — see below. | ✅ |

### Defect found & fixed: parse-failure was silent/misleading

`parseTranscript` **never threw** — on total failure (LM Studio unreachable / bad JSON) it returned `emptyParsed(rawText)`. Consequences:

1. `handleParse`'s `catch` branch was **dead code**; `parseError` was never set.
2. A genuine failure rendered the *same* UI as a legitimately-empty transcript ("The LLM did not extract any structured items…").
3. The **Retry** button (only rendered when `parseError` is set) never appeared, so the user had no recovery path and no error signal.

**Fix applied** (`lib/transcript-parser.ts`): on exhausted retries, throw the captured `lastError` instead of returning an empty parse. Empty *input* is still handled earlier (returns `emptyParsed` without error; the `handleParse` guard `!hasTranscript` prevents calling on blank text). Now a real failure propagates to `handleParse`'s `catch`, sets `parseError`, and surfaces the Retry button. Build re-verified green after the change.

This closes the requirement #4 gap.

---

## 5. Build

```
npm run build   (tsc -b && vite build)
✓ 1807 modules transformed
dist/index.html                  0.40 kB
dist/assets/index-*.css        38.75 kB
dist/assets/index-*.js        382.68 kB
✓ built in ~103ms
```

- `tsc -b` passes under `strict: true` (no type errors across all 38 source files).
- Styles compile; recording classes present in output CSS.
- Fixed file re-built clean.

✅ **Build passes.**

---

## Verdict: ✅ APPROVED

The full record → save → transcribe → parse → dispatch → archive flow is coherent and complete. Resource cleanup (mic, intervals, object URLs, SpeechRecognition) is thorough — no leaks. IndexedDB metadata and blob stay consistent, drafts are preserved on dispatch, and deletes are paired. Error handling is complete **after the one fix below**.

### Changes made during review
- `lib/transcript-parser.ts` — `parseTranscript` now throws on exhausted retries instead of returning a silent empty parse, so LM Studio failures surface correctly (Retry button shows, no false "no items extracted" message). Build re-verified.

### Non-blocking follow-ups (recommend, not required)
1. `end()` grabs only the single most-recent recording; fine for current one-recording-per-session UX but worth revisiting if multiple recordings per session are added.
2. Interim segments use `endOffset: Number.MAX_SAFE_INTEGER` as a sentinel sort key — works, but if any downstream sorts on `endOffset` numerically it will dominate; acceptable for current UI.
3. Whisper path is still a stub (`isTranscriptionSupported("whisper")` is hard `false`, Phase 2b) — expected and clearly gated; not a blocker.

— Klerik
