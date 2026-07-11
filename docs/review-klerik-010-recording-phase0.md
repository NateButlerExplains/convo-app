# Review: Phase 0 — Conversation Recording Foundation

**Reviewer:** Klerik  
**Date:** 2026-07-08  
**Scope:** Types, IndexedDB store, audio recorder, transcription service, state events  
**Files reviewed:**
- `app/src/types/move-map.ts` — 6 new types
- `app/src/lib/audio-store.ts` — IndexedDB wrapper
- `app/src/lib/audio-recorder.ts` — MediaRecorder state machine
- `app/src/lib/transcription-service.ts` — Web Speech API + Whisper stub
- `app/src/lib/state-events.ts` — Event constants

**Build result:** `npx tsc --noEmit` — **PASS** (no errors)

---

## 1. Types (`move-map.ts`)

Six new types added cleanly after the existing M1 types:

| Type | Verdict | Notes |
|------|---------|-------|
| `RecordingState` | ✅ | 8 states cover full lifecycle: idle → preparing → recording → paused → stopped → transcribing → done/error |
| `TranscriptionMethod` | ✅ | Discriminated union of `"web-speech" | "whisper"` |
| `TranscriptSegment` | ✅ | Has `id`, `speaker`, `text`, `startOffset`, `endOffset`, `isFinal` — well-structured for timestamped transcription |
| `ParsedTranscriptItem` | ✅ | Discriminated `type` field (`action_item | decision | summary_point | question`), optional `owner`/`relatedSpeaker`, linked back via `sourceSegmentIds` |
| `ParsedTranscript` | ✅ | Groups items into `actionItems`, `decisions`, `keyQuestions`, plus `summary` and `rawTranscript` |
| `RecordedAudio` | ✅ | Metadata record with `id`, `mimeType`, `durationSeconds`, `createdAt`, `dbKey` (not the blob itself — blobs live in IndexedDB) |

**Verdict: Solid foundation.** Types are sufficiently rich for Phase 1 consumption. The `ParsedTranscriptItem` design with source linking via `sourceSegmentIds` is forward-looking.

⚠ **Minor concern:** `TranscriptSegment` in `move-map.ts` uses `startOffset`/`endOffset` (number offsets), while the transcription service's own `TranscriptSegment` uses `timestamp` (number epoch ms). These are semantically different — see §4 below.

---

## 2. `audio-store.ts` — IndexedDB CRUD

```
DB:     barcelona-relocation-audio
Store:  recordings
Schema: inline-key (no keyPath), blob values
```

| Function | Behaviour | Verdict |
|----------|-----------|---------|
| `openDB()` | Opens connection, creates store in `onupgradeneeded` | ✅ |
| `saveAudio(id, blob)` | `store.put(blob, id)` with readwrite tx | ✅ |
| `getAudio(id)` | `store.get(id)` → `Blob | undefined` | ✅ |
| `deleteAudio(id)` | `store.delete(id)` with readwrite tx | ✅ |
| `getAllAudio()` | Cursor iteration → `{id, blob}[]` | ✅ |

**Checklist:**
- [x] `onupgradeneeded` creates store only if not already present (`!db.objectStoreNames.contains(STORE_NAME)`)
- [x] Error handling on all three transaction outcomes: `oncomplete`, `onerror`, `onabort`
- [x] Cursor loop in `getAllAudio` terminates correctly with `resolve(results)` when cursor is null
- [x] `getAudio` coalesces `null` → `undefined` for clean undefined-return semantics

**Verdict: Correct and complete.** No bugs. Each function opens its own connection for simplicity — acceptable for Phase 0. Could be optimised with a connection pool later.

---

## 3. `audio-recorder.ts` — MediaRecorder State Machine

### State machine

```
                     ┌─────────┐
         ┌───────────│  idle   │◄─────────┐
         │  error     └────┬────┘          │
         │                 │ start()       │
         │          ┌──────▼──────┐        │
         │          │  preparing  │        │
         │          └──────┬──────┘        │
         │      getUserMedia│              │
         │          ┌──────▼──────┐        │
         │  error   │  recording  │        │
         │     ┌────┴──┬────▲──┬─┘        │
         │     │       │    │   │          │
         │     │   pause()  resume()       │
         │     │       │         │         │
         │     │   ┌───▼─────────┴──┐      │
         │     │   │     paused     │      │
         │     │   └───┬────────────┘      │
         │     │       │                   │
         │     │   stop()          stop()  │
         │     │       │                   │
         │  ┌──▼───────▼───────────────────▼──┐
         │  │            stopped               │
         │  └──────────────────────────────────┘
```

**Transitions verified:**

| From | Action | To | Guard |
|------|--------|----|-------|
| idle | start() → getUserMedia OK | recording | ✅ Throws if not idle |
| idle | start() → getUserMedia error | idle (rollback) | ✅ State rolled back, error called |
| recording | stop() → onstop handler | stopped | ✅ Only from recording/paused |
| paused | stop() → onstop handler | stopped | ✅ "
| recording | pause() → media.pause() | paused | ✅ Only from recording |
| paused | resume() → media.resume() | recording | ✅ Only from paused |
| any | MediaRecorder error → cleanup | idle | ✅ Cleanup + callback |

**Error handling:**
- `start()`: catches getUserMedia rejection, resets to `idle`, calls `onError`, rethrows
- `onerror`: nulls media/stream, resets to `idle`, calls `onError`
- `stop()`: is a no-op if from invalid states

### ⚠ Bug: mime type operator precedence

```typescript
// Line 42-44 — INCORRECT
const mime = this.opts.mimeType ?? MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
  ? "audio/webm;codecs=opus"
  : "audio/webm";
```

Due to `??` having higher precedence than the ternary `? :`, this parses as:

```
(this.opts.mimeType ?? MediaRecorder.isTypeSupported(...))
  ? "audio/webm;codecs=opus"          // always taken when mimeType is truthy
  : "audio/webm"                       // never reached with a set mimeType
```

**Impact:** If a caller passes `mimeType: "audio/mp4"`, the ternary's truthy branch always returns `"audio/webm;codecs=opus"` instead of the caller's value. **Low severity for Phase 0** (callers won't customise mimeType yet), but should be fixed before Phase 1 ships.

**Fix:** Wrap the ternary in parentheses:

```typescript
const mime = this.opts.mimeType ?? (
  MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
    ? "audio/webm;codecs=opus"
    : "audio/webm"
);
```

### ⚠ Minor: `RecorderState` naming collision

The class defines `RecorderState` (5 states: idle/preparing/recording/paused/stopped) while `move-map.ts` defines `RecordingState` (8 states: adds transcribing/done/error). These are intentionally different layers — hardware vs. UI lifecycle — but the near-identical names (`RecorderState` vs `RecordingState`) will confuse readers. The `RecordingState` in move-map.ts does NOT appear in `audio-recorder.ts`, so the bridge between them must be constructed in the Phase 1 `useRecording` hook.

**Recommendation:** Add a JSDoc comment on `RecorderState` explaining it's the internal hardware-state subset, while `RecordingState` (from move-map.ts) covers the full lifecycle including transcription phases.

**Verdict: Functionally correct.** One operator-precedence bug (minor, no practical impact yet). State machine covers all expected paths including error rollback.

---

## 4. `transcription-service.ts` — Web Speech API + Whisper Stub

**Interface:**
- `ITranscriptionService` with `startTranscript(callbacks)`, `stopTranscript()`, `isRunning` ✅
- `TranscriptionCallbacks` with `onSegment`, `onComplete`, `onError`, `onStateChange` ✅

**WebSpeechTranscription:**
- `getSpeechRecognition()` checks both prefixed and unprefixed constructors ✅
- `continuous: true`, `interimResults: true`, `lang: "en-US"` ✅
- Restart-on-silence: `no-speech` error triggers 300ms delayed `recognition.start()` ✅
- `onend` auto-restart while `this.running` is true ✅
- Cleanup: `stopTranscript()` clears timer, stops recognition, nulls reference, fires "done" ✅
- Race safety: `stopTranscript` sets `running = false` before `recognition.stop()`, so any subsequent `onend` won't restart ✅

**WhisperTranscription (stub):**
- `startTranscript()` returns an error message ✅
- `transcribeAudio()` throws with "not yet implemented" ✅
- Accepts `WhisperOpts` with `endpoint`, `model`, `language` for future use ✅

### ⚠ Issue: Duplicate `TranscriptSegment` type

`transcription-service.ts` defines its own `TranscriptSegment`:

```typescript
type TranscriptSegment = {
  id: string;
  text: string;
  isFinal: boolean;
  timestamp: number;       // epoch ms
};
```

While `move-map.ts` defines a different `TranscriptSegment`:

```typescript
type TranscriptSegment = {
  id: string;
  speaker: string;
  text: string;
  startOffset: number;     // time offset
  endOffset: number;       // time offset
  isFinal: boolean;
};
```

These are **different shapes**. The service emits raw segments with `timestamp` (epoch ms) and no speaker/offset info. The canonical type has `speaker`, `startOffset`, `endOffset` (relative positioning) and no absolute timestamp. This means:
- The service's `onSegment` callback can't directly produce `TranscriptSegment` from `move-map.ts`
- A bridge/adapter is needed (likely in Phase 1's `useRecording` hook) to convert between these

**Recommendation:** Either (a) align the service type with the canonical type and compute offsets from base time, or (b) add a JSDoc on the local type noting it's an internal wire format that gets transformed to the canonical type by the consumer. As-is, it's a footgun for the next developer.

**Verdict: Functionally correct implementation, but type inconsistency needs resolution.** Acceptable for Phase 0 as the bridge hasn't been built yet.

---

## 5. `state-events.ts` — Event Constants

| Constant | Helper Function | CustomEvent Detail |
|----------|----------------|--------------------|
| `MOVE_MAP_STATE_CHANGED_EVENT` | `notifyMoveMapStateChanged()` | None (plain Event) |
| `TRANSCRIPT_READY_EVENT` | `notifyTranscriptReady()` | None (CustomEvent with no detail) |
| `AUDIO_SAVED_EVENT` | `notifyAudioSaved(detail?)` | `{ id: string; durationSeconds: number }` |

**Correctness:**
- All helpers guard `typeof window === "undefined"` for SSR/server contexts ✅
- `notifyAudioSaved` uses `CustomEvent` with optional `detail` ✅
- Constants are exported for consumers to `addEventListener` against ✅

**Verdict: Clean and complete.** Minimal but exactly what Phase 0 needs.

---

## Build Verification

```
$ cd app && npx tsc --noEmit
→ exit code 0, no output (clean pass)
```

All 5 new files compile without errors.

---

## Overall Verdict

### APPROVED — with minor fixes recommended before Phase 1

| Check | Result |
|-------|--------|
| Types complete and well-structured | ✅ PASS (with §4 type duplication note) |
| audio-store IndexedDB open/upgrade correct | ✅ PASS |
| audio-recorder state machine covers all transitions | ✅ PASS (with §3 mimeType precedence bug) |
| Build passes | ✅ PASS |

### Action items (recommended, not blocking)

1. **Fix mime type operator precedence** in `audio-recorder.ts:42-44` — add parentheses around the ternary so custom mimeTypes work.
2. **Add JSDoc** to `RecorderState` clarifying it's an internal state subset vs. the UI-facing `RecordingState`.
3. **Resolve `TranscriptSegment` type duplication** — align or document the service-internal wire format vs. the canonical type. This will become a real bug in Phase 1 when `onSegment` data needs to become a canonical `TranscriptSegment`.

Phase 0 is ready for Phase 1 UI work to proceed.