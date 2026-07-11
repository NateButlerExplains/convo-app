# Review — Klerik #011 · Conversation Recording Phase 1

**Reviewer:** Klerik
**Date:** 2026-07-08
**Scope:** `app/src/components/RecordingControls.tsx`, `app/src/hooks/useRecording.ts`, `app/src/views/ConversationView.tsx`, `app/src/styles.css` (recording block)
**Verdict:** **NEEDS_CHANGES**

Build verified: `npm run build` → `tsc -b && vite build` passes (exit 0, 1802 modules, no type errors).

---

## Verdict Justification

All four explicit checklist items *nominally* pass, but the "no memory leaks" requirement has a real gap: the recorder/mic stream is released on stop/error, **but not on component unmount while recording**. That leaves the MediaStream (and the OS mic indicator) open on view navigation. Because Klerik blocks work that leaks resources or leaves the mic on, this is a blocking defect.

---

## Findings

### 🔴 Blocking — memory leak on unmount

`useRecording` never stops the `AudioRecorder` when the component unmounts mid-recording. `ConversationView` is a tab view; navigating away while `recordingState === "recording"` (or `"paused"`) abandons the `MediaRecorder` and the mic `MediaStream`. The duration-`setInterval` effect cleans up, but the recorder instance held in `recorderRef.current` is never torn down.

- File: `app/src/hooks/useRecording.ts` (no unmount effect)
- Fix: add an unmount guard that stops the recorder and releases the stream, e.g.
  ```ts
  useEffect(() => () => {
    recorderRef.current?.stop();
    recorderRef.current = null;
  }, []);
  ```
  Confirm `AudioRecorder.stop()` is safe to call when already stopped (it early-returns for non-recording/paused states — it is, good). Also null the ref after a normal stop in `stopRecording` so a stale instance isn't retained.

### 🟡 Should-fix — saved blobs carry no metadata

`audio-store.saveAudio(id, blob)` persists only the raw `Blob`. The `RecordedAudio` type in `move-map.ts` (id, mimeType, durationSeconds, createdAt, dbKey) is never written, and the actual recorded duration computed in `AudioRecorder.onstop` (`_durationMs`) is discarded in `useRecording`'s `onStop` closure.

- Impact: Phase 2 (transcription, playback, listing recordings) will have no discoverable/playable metadata and no mime type.
- Fix (recommended before Phase 2): persist a `RecordedAudio` record alongside the blob (store object `{ id, mimeType, durationSeconds, createdAt, dbKey }` with `dbKey` pointing at the blob key), and use `_durationMs` instead of the tick-based `durationSeconds` for the authoritative duration.

### 🟡 Minor — misleading busy label

In `RecordingControls`, `isBusy` covers both `"preparing"` and `"transcribing"`, but the Record button label is hardcoded to `"Preparing…"`. `transcribing` is not reached in Phase 1, but if it ever is the label would be wrong.

- File: `app/src/components/RecordingControls.tsx` (line 55)
- Fix: branch the label on the actual state, or track a separate `busyLabel` prop.

### ⚪ Nit — redundant assignment

`const blob = _blob;` in the `onStop` closure (`useRecording.ts` line 55) is dead; just use `_blob`. Harmless.

---

## Checklist Results

| Check | Result | Notes |
|-------|--------|-------|
| RecordingControls handles all 8 `RecordingState` values | ✅ PASS | idle/recording/paused/stopped/done/error/preparing/transcribing all render without error; button enable/disable + label logic correct; red-dot only in active states. |
| useRecording saves to IndexedDB on stop | ✅ PASS (with caveat) | `saveAudio` is awaited in `onStop`; IndexedDB write wired correctly. Caveat: no metadata persisted (see 🟡). |
| ConversationView disables session start/resume while recording | ✅ PASS | `isRecording = recordingState==="recording" \|\| "paused"`; `startOrResume` button `disabled={isRecording}`. |
| No memory leaks (intervals cleared, mic stream released) | ❌ FAIL | Intervals cleared ✓; mic released on stop/error ✓; **mic NOT released on unmount during recording** 🔴. |
| CSS clean & matches existing style | ✅ PASS | Uses project tokens (`--coral`, `--amber`, `--muted`, `--shadow`, 30px card radius); pulse keyframes consistent; matches `print-actions` button styling. |
| Build passes | ✅ PASS | `npm run build` exit 0 (verified). |

---

## Required Before Phase 2

1. Add unmount cleanup to `useRecording` (blocking).
2. Persist `RecordedAudio` metadata with the blob and capture the real duration (needed for transcription/playback).

## Optional

- Fix busy-label wording for `transcribing`.
- Drop redundant `const blob = _blob;`.
