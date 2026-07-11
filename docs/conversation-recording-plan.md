# In-App Audio Recording & Transcription — Build Plan

**Author:** Senter (project coordinator)  
**Date:** 2026-07-08  
**Status:** Draft — ready for Crow (research), then Chizul (implementation), then Klerik (review)

---

## 1. Architecture Overview

```
┌────────────────────────────────────────────────────────────────────┐
│                        Browser (React/TS)                          │
│                                                                    │
│  ┌─────────────┐   ┌──────────────────┐   ┌──────────────────┐    │
│  │ MediaRecorder│   │  Transcription   │   │  Transcript       │    │
│  │ (audio)      │──▶│  Service          │──▶│  Parser (LLM)    │    │
│  └─────────────┘   │                  │   └────────┬─────────┘    │
│                    │  Web Speech API   │            │              │
│                    │  OR               │            ▼              │
│                    │  Whisper API      │   ┌──────────────────┐    │
│                    │  (localhost:1234) │   │  Structured Data │    │
│                    └──────────────────┘   │  · action items   │    │
│                                           │  · decisions      │    │
│                                           │  · summary        │    │
│                                           └────────┬─────────┘    │
│                                                    │              │
│                    ┌──────────────────┐             │              │
│                    │  Persistence     │◀────────────┘              │
│                    │  · IndexedDB     │                            │
│                    │  · localStorage  │                            │
│                    │  · Blob/URL      │                            │
│                    └──────────────────┘                            │
│                           │                                        │
│                           ▼                                        │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────┐                 │
│  │ Tasks    │  │ Decisions    │  │ Session      │                 │
│  │ View     │  │ View         │  │ Archive      │                 │
│  └──────────┘  └──────────────┘  └──────────────┘                 │
└────────────────────────────────────────────────────────────────────┘

External:
  ┌─────────────────┐
  │ LM Studio        │  (localhost:1234)
  │ · Whisper (ASR)  │
  │ · LLM (parsing)  │
  └─────────────────┘
```

### Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Audio storage | IndexedDB via `idb-keyval` wrapper | localStorage maxes at ~5 MB; audio blobs are 1–10 MB/min. IndexedDB handles multi-MB blobs natively. |
| Transcription path | Configurable: Web Speech API for free, Whisper API for accuracy | Web Speech works offline but is browser- and language-limited. Whisper via LM Studio gives higher quality and works across all browsers. |
| Transcript parsing | LM Studio LLM endpoint (localhost:1234/v1/chat/completions) | Same model as Whisper server, structured JSON output via system prompt, avoids adding another provider. |
| Cross-view sync | Custom events + localStorage key for structured data | Matches existing pattern (`notifyMoveMapStateChanged`). Tasks/Decisions views get new items via localStorage updates they already listen for. |
| Audio file reference | Blob URL + IndexedDB key in archived session | No external file system writes needed; IndexedDB stores the raw .webm/.ogg blob. |

---

## 2. Data Model Extensions

### 2.1 New Types (add to `app/src/types/move-map.ts`)

```typescript
// ── Recording & Transcription ──

export type RecordingState = "idle" | "preparing" | "recording" | "paused" | "stopped" | "transcribing" | "done" | "error";

export type TranscriptionMethod = "web-speech" | "whisper";

export type TranscriptSegment = {
  id: string;
  speaker: string;          // "Nate" | "Shae" | "unknown"
  text: string;
  startOffset: number;      // seconds from recording start
  endOffset: number;
  isFinal: boolean;         // false for interim Web Speech results
};

export type ParsedTranscriptItem = {
  type: "action_item" | "decision" | "summary_point" | "question";
  text: string;
  confidence: "high" | "medium" | "low";
  owner?: string;           // only for action items
  relatedSpeaker?: string;
  sourceSegmentIds: string[];
};

export type ParsedTranscript = {
  summary: string;                         // 2-3 sentence session summary
  actionItems: ParsedTranscriptItem[];     // → Tasks view
  decisions: ParsedTranscriptItem[];       // → Decisions view
  keyQuestions: ParsedTranscriptItem[];
  rawTranscript: string;                   // full concatenated text
};

// ── Recorded Audio ──

export type RecordedAudio = {
  id: string;                // UUID, matches session ID
  mimeType: string;          // "audio/webm" or "audio/ogg"
  durationSeconds: number;
  createdAt: string;         // ISO 8601
  dbKey: string;             // IndexedDB key where the blob lives
};
```

### 2.2 Extended Session Types (within `ConversationView.tsx`)

```typescript
// Extend the existing ArchivedSession type:
type ArchivedSession = {
  // ...existing fields...
  recording?: RecordedAudio | null;
  transcript?: ParsedTranscript | null;
  transcriptionMethod?: TranscriptionMethod;
};
```

### 2.3 New IndexedDB Store

- **Database name:** `barcelona-relocation-audio`
- **Store name:** `recordings`
- **Key:** session ID (UUID, matches the `RecordedAudio.id`)
- **Value:** `Blob` (raw .webm or .ogg audio data)
- **Library:** Use bare `indexedDB` wrapper (no external dependency needed — ~40 lines in a utility module)

---

## 3. Component Changes

### 3.1 New Files

| File | Purpose | Owner |
|------|---------|-------|
| `app/src/lib/audio-recorder.ts` | MediaRecorder wrapper — start, stop, pause, resume, blob output | Chizul |
| `app/src/lib/transcription-service.ts` | Unified transcription interface (Web Speech / Whisper), speech recognition, segment callbacks | Chizul |
| `app/src/lib/transcript-parser.ts` | Calls LM Studio LLM to parse raw transcript → `ParsedTranscript` structured output | Chizul |
| `app/src/lib/audio-store.ts` | IndexedDB CRUD for audio blobs | Chizul |
| `app/src/components/RecordingControls.tsx` | Record/stop/pause button bar + timer + waveform indicator | Chizul |
| `app/src/components/TranscriptView.tsx` | Live transcript display with speaker labels, interim highlights | Chizul |
| `app/src/components/TranscriptParserPanel.tsx` | Shows parsed action items, decisions, summary; "Send to Tasks" and "Send to Decisions" buttons | Chizul |
| `app/src/components/TranscriptionSettings.tsx` | Toggle between Web Speech / Whisper, show connection status | Chizul |

### 3.2 Modified Files

| File | Changes | Owner |
|------|---------|-------|
| `app/src/views/ConversationView.tsx` | Add recording UI section, transcript display, parser panel, cross-view dispatch | Chizul |
| `app/src/types/move-map.ts` | Add all new types from §2.1 | Chizul |
| `app/src/styles.css` | Styles for recording controls, transcript cards, parser output | Chizul |
| `app/src/lib/state-events.ts` | Add event constants for transcript-ready, audio-saved | Chizul |

### 3.3 Cross-View Integration

When a session is ended and the transcript is parsed:

1. **Action items** → write to `localStorage` key `move-map:tasks-view`
   - Pre-fill: `{ title, track: "conversation", status: "not_started", owner: parsedItem.owner || "Unassigned", notes: `From session: ${sessionLabel}` }`
   - Dispatch `notifyMoveMapStateChanged()` so TasksView picks it up on next mount

2. **Decisions** → write to `localStorage` key `move-map:decisions-view`
   - Pre-fill: `{ title, status: "proposed", readiness: "open_question", rationale: parsedItem.text, approvers: ["Nate", "Shae"], notes: `From session: ${sessionLabel}` }`
   - Dispatch `notifyMoveMapStateChanged()`

3. **Session archive** → the `ArchivedSession` object now includes `recording` and `parsedTranscript` fields, stored under existing `barcelona-relocation-archived-sessions` key in localStorage

---

## 4. API Endpoints Needed

### 4.1 Whisper Transcription (LM Studio — NOT AVAILABLE)

**Update (2026-07-08):** Crow verified that LM Studio does **not** expose a Whisper endpoint. `/v1/audio/transcriptions` returns `{"error":"Unexpected endpoint or method."}`. This path is blocked until LM Studio adds speech-to-text support ([GitHub issue #1715](https://github.com/lmstudio-ai/lmstudio-bug-tracker/issues/1715)).

**Fallback transcription paths:**
- **Web Speech API** (Phase 2a) — in-browser, works now, single-speaker only, <1s latency
- **Local Whisper** (Phase 2b, optional) — `pip install openai-whisper` or `whisper.cpp` for higher accuracy

```
POST http://localhost:1234/v1/audio/transcriptions
Content-Type: multipart/form-data

model: "whisper-1" (or whatever LM Studio exposes)
file: <audio blob>
language: "en"
response_format: "verbose_json"
```

**Response** (LM Studio OpenAI-compatible):

```json
{
  "text": "Full transcript text...",
  "segments": [
    {
      "id": 0,
      "start": 0.0,
      "end": 4.5,
      "text": "I think we should look at the neighborhood options first.",
      "tokens": [...]
    }
  ]
}
```

**Fallback:** If LM Studio Whisper endpoint returns 404 or connection refused → fall back to Web Speech API.

### 4.2 LLM Transcript Parsing (LM Studio)

```
POST http://localhost:1234/v1/chat/completions
Content-Type: application/json

{
  "model": "local-model-name",
  "messages": [
    {
      "role": "system",
      "content": "You parse family conversation transcripts about relocation planning. Extract: 1) action items (tasks someone agreed to do), 2) decisions (agreements reached), 3) key questions (unresolved), 4) a 2-3 sentence summary. Return valid JSON of type ParsedTranscript. Be conservative — only extract items that are clearly stated."
    },
    {
      "role": "user",
      "content": "<full transcript text>"
    }
  ],
  "response_format": { "type": "json_object" },
  "temperature": 0.1
}
```

**Response shape** (matches `ParsedTranscript` type above):

```json
{
  "summary": "Nate and Shae discussed neighborhood options...",
  "actionItems": [
    { "type": "action_item", "text": "Research school ratings in Eixample", "confidence": "high", "owner": "Nate" }
  ],
  "decisions": [
    { "type": "decision", "text": "Prioritize neighborhoods within 20 min of international schools", "confidence": "medium" }
  ],
  "keyQuestions": [
    { "type": "question", "text": "What is the actual commute time from Gracia to the business district?", "confidence": "low" }
  ],
  "rawTranscript": "..."
}
```

### 4.3 Web Speech API (Browser — No Endpoint)

```typescript
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.continuous = true;
recognition.interimResults = true;
recognition.lang = "en-US";
```

- Runs entirely in-browser, no network calls
- Returns interim results (partial words) + final results (committed phrases)
- No speaker diarization — single speaker only
- **Limitation:** Stops after ~30–60 seconds of silence; must be restarted
- **Implementation:** Wrap in a restart-on-silence loop in `transcription-service.ts`

---

## 5. Phased Implementation Sequence

### Phase 0: Foundation & Types (1–2 days)

**Goal:** Data model + audio storage + service stubs.

| Task | Agent |
|------|-------|
| Add all new types to `move-map.ts` (`RecordingState`, `TranscriptSegment`, `ParsedTranscript`, `RecordedAudio`, etc.) | Chizul |
| Create `audio-store.ts` — IndexedDB wrapper for blob CRUD | Chizul |
| Create `audio-recorder.ts` — MediaRecorder wrapper with state machine | Chizul |
| Create `transcription-service.ts` — interface + Web Speech implementation | Chizul |
| Add new event constants to `state-events.ts` | Chizul |
| Review | Klerik |

**Verification:** `npm run build` passes with new types. `audio-store.ts` can store + retrieve a mock blob. `audio-recorder.ts` state machine cycles through all states without crashing.

### Phase 1: Basic Recording UI (2–3 days)

**Goal:** Record button that works, saves audio to IndexedDB, shows waveform.

| Task | Agent |
|------|-------|
| Build `RecordingControls.tsx` — start/stop/pause buttons, recording timer, live waveform visualization (canvas-based amplitude bars) | Chizul |
| Integrate `RecordingControls` into `ConversationView.tsx` above the session card grid | Chizul |
| Wire recording to state management: `useRecording` custom hook that wraps `audio-recorder.ts` | Chizul |
| Show recording status in summary strip (e.g., "Recording • 2:34") | Chizul |
| Style recording controls, status pill, waveform | Chizul |
| Review | Klerik |

**Verification:** User can click Record → see waveform + timer → Stop → audio blob saved to IndexedDB. On page reload, blob is still retrievable.

### Phase 2: Transcription (2–3 days)

**Goal:** Recorded audio → text, displayed live or post-recording.

| Task | Agent |
|------|-------|
| Implement Whisper transcription path in `transcription-service.ts` — POST to `localhost:1234/v1/audio/transcriptions`, handle auth/errors | Chizul |
| Implement Web Speech path — live transcription with restart-on-silence loop | Chizul |
| Build `TranscriptionSettings.tsx` — toggle between Web Speech / Whisper, show connection status dot (green for Whisper available, gray for offline) | Chizul |
| Build `TranscriptView.tsx` — scrollable text display with speaker labels, interim highlight styling | Chizul |
| Wire: when recording ends → auto-transcribe (Whisper path) OR live-feed (Web Speech path) | Chizul |
| Add `TranscriptionSettings` to conversation page header area | Chizul |
| Style transcript view, speaker labels, confidence colors | Chizul |
| Review | Klerik |

**Verification:**
- Whisper path: Record → Stop → see transcribed text appear within 5–30 seconds (varies with audio length)
- Web Speech path: See words appear in real time during recording
- Toggle works correctly, settings persist in localStorage

### Phase 3: Transcript Parsing & Cross-View Dispatch (2–3 days)

**Goal:** Transcript → structured data → Tasks view + Decisions view + archive.

| Task | Agent |
|------|-------|
| Build `app/src/lib/transcript-parser.ts` — calls LM Studio LLM endpoint, retries on failure, parses JSON response | Chizul |
| Build `TranscriptParserPanel.tsx` — shows parsed action items, decisions, summary with "Send to Tasks" / "Send to Decisions" buttons | Chizul |
| Implement cross-view dispatch: on "Send to Tasks" → prepend task to localStorage `move-map:tasks-view` array + dispatch event | Chizul |
| Implement cross-view dispatch: on "Send to Decisions" → prepend decision to localStorage `move-map:decisions-view` + dispatch event | Chizul |
| Update `ArchivedSession` type to include `parsedTranscript`, `recording`, `transcriptionMethod` | Chizul |
| Extend session archiving (`end()` function in ConversationView) to save recordedAudio ref + parsed transcript alongside existing report | Chizul |
| Show parsed summary + action items in archived session details (expanded view) | Chizul |
| Add audio playback button to archived session (retrieve blob from IndexedDB, play via `<audio>` element) | Chizul |
| Style parser panel, archive playback UI | Chizul |
| Review | Klerik |

**Verification:**
- After recording + transcribing a session → "Parse with LLM" button → structured action items and decisions appear
- Clicking "Send to Tasks" → task appears on Tasks page after navigation
- Clicking "Send to Decisions" → decision appears on Decisions page
- Archived session shows transcript summary + audio playback button
- Audio plays back from IndexedDB blob

### Phase 4: Polish & Edge Cases (1–2 days)

**Goal:** Error handling, empty states, offline grace, performance.

| Task | Agent |
|------|-------|
| Handle microphone permission denial — show banner with "Grant mic access in browser settings" | Chizul |
| Handle Whisper endpoint down — auto-fall back to Web Speech, show status indicator | Chizul |
| Handle very long recordings (>30 min) — chunked Whisper transcription, or limit recording to 60 min with warning | Chizul |
| Handle IndexedDB quota errors — show "Storage full, delete old recordings" message | Chizul |
| Add recording delete from archive — delete IndexedDB blob + remove from archived sessions list | Chizul |
| Add auto-parse on session end (opt-in toggle in settings) | Chizul |
| Add loading spinners for transcription and parsing phases | Chizul |
| Empty states: no transcript yet, transcription in progress, parsing failed | Chizul |
| Keyboard a11y: tab through recording controls, aria-labels, live region for status changes | Chizul |
| Final review + build check | Klerik |

**Verification:**
- Denying microphone → graceful degradation with clear message
- Killing LM Studio → auto-fallback to Web Speech + status indicator
- Recording 30+ min → either works chunked or shows warning
- Deleting an archived session also deletes its audio from IndexedDB
- Full a11y pass on recording controls

---

## 6. Fleet Routing Summary

| Phase | Coordinator | Implementer | Reviewer | Research Support | Memory |
|-------|-------------|-------------|----------|------------------|--------|
| Phase 0 | Senter | Chizul | Klerik | — | Kashik (update types) |
| Phase 1 | Senter | Chizul | Klerik | Crow (MediaRecorder ergonomics research if needed) | Kashik |
| Phase 2 | Senter | Chizul | Klerik | Crow (LM Studio Whisper API compat) | Kashik |
| Phase 3 | Senter | Chizul | Klerik | — | Kashik |
| Phase 4 | Senter | Chizul | Klerik | — | Kashik |

**Notes on routing:**
- **Crow** may be needed in Phase 2 for LM Studio Whisper endpoint specifics if the current LM Studio model doesn't expose `/v1/audio/transcriptions`. Crow should verify the endpoint shape and return a concise research note.
- **Nous-girl** may be consulted for the waveform / recording UI visual direction if the team wants design input beyond functional UI.
- **Anser** should write user-facing descriptions for any new settings or tooltips.
- **Kashik** should update `memory/decisions.md` with key architectural decisions after each phase review.

---

## 7. Risk & Mitigation

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| LM Studio Whisper endpoint not exposed | Medium | Implement Web Speech API as primary fallback in Phase 2; verify with Crow first |
| IndexedDB quota on large audio files | Low | `.webm` at 16 kHz mono is ~1 MB/min; even 60 min is ~60 MB, well within browser quota (~2 GB for most browsers) |
| Web Speech API stops mid-recording | High | Implement restart-on-silence loop + merge segments after stop |
| LLM parsing returns malformed JSON | Medium | Add retry (3 attempts) + fallback to raw transcript if all fail |
| Cross-view sync timing (tasks/decisions stale) | Low | Both views read from localStorage on mount and on `move-map:state-changed` event — already implemented pattern |

---

## 8. Files Created / Modified (Complete List)

### Created
- `app/src/lib/audio-recorder.ts`
- `app/src/lib/transcription-service.ts`
- `app/src/lib/transcript-parser.ts`
- `app/src/lib/audio-store.ts`
- `app/src/components/RecordingControls.tsx`
- `app/src/components/TranscriptView.tsx`
- `app/src/components/TranscriptParserPanel.tsx`
- `app/src/components/TranscriptionSettings.tsx`

### Modified
- `app/src/types/move-map.ts` — add RecordingState, TranscriptSegment, ParsedTranscript, RecordedAudio types
- `app/src/views/ConversationView.tsx` — integrate recording UI, transcript display, parser, cross-view dispatch
- `app/src/styles.css` — styles for all new components
- `app/src/lib/state-events.ts` — new event constants