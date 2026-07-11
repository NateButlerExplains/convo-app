# Decisions

## 2026-07-03 — Initial Project Direction
- Build a private local-first relocation planning dashboard for moving from Malden, Missouri to Barcelona around January 2027.
- The dashboard should run on localhost and not be published online.
- The system should support roadmap planning, budget tracking, options comparison, decisions, tasks, risks, and PDF/snapshot exports.
- Nate will be the only direct updater, but the dashboard should be readable and useful for conversations with his wife.

## 2026-07-04 — M1 Prototype Shipped
- M1 is a read-only/manual-edit localhost prototype under `app/` using Vite, React, TypeScript, plain CSS, and local JSON seed data.
- M1 intentionally excludes authentication, backend services, SQLite, cloud services, analytics, telemetry, external runtime calls, remote fonts/CDNs, and in-app editing.
- M1 exports use browser print/save-as-PDF and local JSON snapshot download; generated PDF support is deferred.
- Klerik review approved M1 with notes and no blockers; the seed-data relationship note was fixed before closeout.

## 2026-07-05 — M4 Income & Housing Planning
- M4 is the active planning slice for income and housing.
- The M4 page uses localStorage for persistent edits and additions.
- M4 focuses on editable income rows, housing rows, archive sections, add-new flow, duplicate/archive actions, and ellipsis menus.
- M4 remains local-first and private; no cloud dependencies were added.
- The M4 page title is `Income & Housing Planning`.

## 2026-07-06 — M1 Seed Data False Positive
- The M1 seed-data relationship note flagged during initial review was verified by Chizul to be a false positive.
- The original 9 seed tasks (including `task-family-priorities`) existed from the start of M1; no missing data or fix needed.

## 2026-07-06 — M3 Family Timeline Shipped
- M3 (Family Timeline / calendar pattern) is approved and documented as shipped.
- Chizul resolved three Klerik-review blockers: `dragItemId` used consistently throughout the view (as a function, not a state variable), try/catch on both localStorage reads and writes.
- `npm run build` passes cleanly with the fixes in place.
- M3 provides a drag-and-drop month calendar with localStorage-backed event persistence, countdown ticker, and event add/edit/delete modal.
- No cloud dependencies were added; M3 remains local-first and private.

## 2026-07-06 — M2 Conversation Mode Shipped
- M2 (Conversation Mode) is approved and documented as shipped.
- localStorage persistence was added for archived conversation sessions with full try/catch guards, SSR guards, and field-by-field validation of all 12 session fields.
- The ConversationView includes a clear-all archive button (shown only when archive is non-empty), individual delete via `deleteArchive`, and a `useEffect` sync that persists on every state change.
- Klerik reviewed and approved both M2 Persistence and the Visual Polish scope (Ideas filter/sort/priority grouping, Options category filter refinements, pros/cons visual layout with per-item meta strip).
- `npm run build` passes cleanly with zero TypeScript errors and zero build warnings.
- No cloud dependencies were added; M2 remains local-first and private.

## 2026-07-06 — M4 Income & Housing Planning Shipped
- M4 is approved and documented as shipped after Klerik's formal review (review-klerik-005-m4-review.md).
- Klerik verified all empty states, UX edge cases, localStorage hygiene (SSR guards, try/catch, type guards, versioned keys), PII/external-call audit, and confirmed `npm run build` passes cleanly.
- Verdict: **SHIP READY** — no fixes needed.
- M4 provides a live-editable, localStorage-backed Income & Housing Planning view with:
  - Editable income rows and housing rows with filters (All / Active / Planned / Brainstorming)
  - Add-new flow, duplicate, archive/restore, expandable archive sections per kind
  - Ellipsis menus, contextual spotlight row, contextual next-action guidance
  - Tailored empty-state messages for every zero-data scenario
- Visual polish completed alongside the milestone: Ideas (filter/sort/priority grouping), Options (category filter refinements, pros/cons visual layout with per-item meta strip).
- No cloud dependencies were added; M4 remains local-first and private.
- This completes the milestone cleanup cycle — all four milestones (M1–M4) are now shipped/approved.

## 2026-07-08 — Conversation Recording Transcription & Parsing Pipeline Fix
- Root cause of the "No speech was detected — nothing to analyze" bug: the live Web Speech API silently failed on Edge (its `onError` only called `stopTranscription()` with no user feedback and no segments captured), and LM Studio (localhost:1234) was offline so the LLM parse step had no server.
- Replaced live Web Speech transcription with **post-recording Whisper API** at `localhost:8000/transcribe` (POST multipart `file`, returns `{text, segments}`). It transcribes the saved audio blob after Stop, not a live mic stream.
- Switched LLM parsing from LM Studio (localhost:1234) to the **9router proxy** at `localhost:20128/v1/chat/completions` with models `cx/gpt-5.4-mini` / `cx/gpt-5.4`.
- New flow: Record → save audio blob to IndexedDB → Whisper transcribes the saved blob → 9router parses into action items / decisions / questions / summary → auto-archive. No manual Parse button, no live transcript text (waveform only, per user UX preference).
- Verified end-to-end: `npm run build` passes; Whisper accepts `audio/webm;codecs=opus` (exactly what `audio-recorder.ts` produces); 9router returns structured JSON; UI renders with zero console errors.
- Klerik review is the mandatory gate before this is marked done (per AGENTS.md). Review dispatched (deleg_94fb308f).
- NOTE: `WebSpeechTranscription` / `createTranscriptionService` / `isTranscriptionSupported` are now dead code (no callers in src/); flagged for Chizul cleanup, not yet removed.

## 2026-07-09 — Speaker Attribution via Floor-Tracking Buttons
- Feature: the LLM analysis attributes action items / decisions / questions to the correct speaker (Nate / Shae / shared) based on who "held the floor" during recording, as marked by the existing speaker-toggle and interrupt buttons.
- Chosen approach: **manual button-driven attribution**, NOT acoustic voice diarization. Rationale: the floor-tracking buttons already existed, Whisper already returns per-segment timestamps, and the parser already supported an `owner` field — so the feature reused existing infrastructure with no new dependencies and no diarization model.
- Mechanism: a floor log records `{atSeconds, speaker}` on each button press (timestamped in audio-elapsed seconds, which freezes on pause exactly like the recorded audio + Whisper timestamps). After Stop, each Whisper segment is mapped to whoever held the floor at its start time, producing a `Nate:/Shae:`-labeled transcript fed to the LLM.
- Fallback: starting speaker before the first toggle, nearest floor-holder thereafter; never "Unknown".
- Closure-staleness pitfall solved with `durationSecondsRef` (mirrors durationSeconds via effect) so button handlers read the current elapsed second, not a stale render value.
- Klerik fixed a stale-state bug: new-session start must clear the Retry caches (lastRecordingRef/lastTranscriptTextRef), else a Retry after a failed Whisper run could mis-attach a prior session's labeled transcript.
- Known limitation accepted: accuracy depends on the user toggling the speaker button when the floor changes; acoustic diarization deferred as possible future work.

## 2026-07-10 — Home Route Rail Uses Live Planning State
- Home is the single route-map surface; the separate Roadmap route/view is intentionally removed.
- Route position is the first incomplete checkpoint in a deterministic sequence: Research, Visa Path, Budget Confidence, Documents, Housing & Schools, Travel, Arrival, Stabilization.
- Checkpoints are completed only by persisted edits on the pages that own the underlying information: Tasks, Decisions, Budget, Income & Housing Planning, and Calendar.
- Home exposes each current checkpoint's requirements as links under `What moves the map`, so progression is explainable rather than implicit.
- Same-tab custom events and cross-tab browser storage events trigger recalculation. Browser local storage remains the source of truth; this does not provide server-backed or multi-device synchronization.
- Existing user state wins over seed data. Seed records are used only when a page has no stored state, preserving stable IDs needed for integration without resetting saved edits.
- The route-map trigger surface should name real seed tasks and conversation follow-ups explicitly so Home guidance never points to ghost text.
- Browser proof for the route rail is currently best treated as a manual visual check plus targeted ad-hoc verification while the repeatable Playwright flow is being stabilized.
