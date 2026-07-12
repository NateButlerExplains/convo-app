# Kanban

## 2026-07-10 Realtime Route-Map Integration — Implementation/Verification Complete
Mission: Make the Home route rail derive its position from saved edits on the existing planning pages rather than static roadmap phase flags.
- [x] Audit localStorage/event wiring and reproduce the disconnected state with a failing Playwright flow
- [x] Define deterministic sequential requirements for Research, Visa, Budget, Documents, Housing & Schools, Travel, Arrival, and Stabilization
- [x] Add shared live route derivation with same-tab and cross-tab refresh
- [x] Preserve seed records on first visit to editable Tasks, Decisions, Budget, Ideas, Options, and Risks pages
- [x] Add Home `What moves the map` guidance with links to each controlling page
- [x] Remove the obsolete standalone Roadmap route/view while retaining the Home route rail
- [x] Verify every checkpoint and the final 8-of-8 state using front-end controls only
- [x] Verify reload persistence, zero browser console errors, self-starting isolated test server cleanup, and production build
- [x] Save seven browser screenshots under `app/verification/route-map/`
- [x] Record Klerik's final independent review verdict  PASS on trigger-map / guidance wiring; runtime browser proof still pending manual visual follow-up
- [x] Polish trigger-library focus flow: Home-origin jumps scroll/focus the target group, add `From Home`, and apply orange emphasis
- [x] Expose the trigger library as a visible, grouped Tasks landing surface with task-to-conversation actions

##  Milestone Cleanup & Polish  In Progress
Mission: Polish, review, and fix M2 (Conversation Mode), M3 (Family Timeline), and M4 (Income & Housing Planning) to **shipped/approved** status through a fleet-wide coordination cycle involving all 8 agents (Senter, Anser, Crow, Chizul, Klerik, Kashik, Nous-girl, Frieza). **All milestones shipped  cycle complete.**
- Coordinate fleet-wide cleanup cycle  Senter
- [x] Rename nav `Home Dashboard` to `Dashboard`; add Core `Aloni's Skills` page with Barcelona Trip star bank, skill star allocation, and six-month listening accomplishments. Build and Playwright DOM verification passed; Klerik review pending.
- [x] Remove the combined `Income & Housing Planning` nav/route; keep split `Income Planning` and `Housing Planning` pages only.
- [x] Remove Decisions page add/new-decision button; decisions now read as Conversation-promoted records.
- [x] Restore shared formatting for Calendar, modal, archive, table, expense, and income/housing layouts.
- [x] Verify page routes and screenshots with `node scripts/verify-page-cleanup.mjs`; `npm run build` passes.


## 2026-07-07 Transcript Feedback Pass  Approved/Complete
Mission: Execute a clarified feedback pass across Home, Conversation, Calendar, Budget, Expenses, Decisions, Options, Ideas, and Tasks. Final approval is now in place and this pass is closed.
- [x] Home / shared shell — change `BCN` to `Move Map`, add rectangular treatment around `Move Map`, keep `Print` + `Download` side by side
- [x] Home / roadmap intro — rewrite the homepage description so it matches what the homepage/roadmap section is actually about
- [x] Conversation — rewrite the copy under `The Big Trip` so it matches the Conversation page purpose
- [x] Calendar — rewrite the header/description so it matches the Calendar page purpose
- [x] Budget — add `Delete all` in the archive area
- [x] Expenses — reduce page structure to two sections/columns only: Nate and wife; ignore the earlier controls note
- [x] Decisions — make actions/add flow follow the Expenses page pattern; remove total decision count from header; make cards more compact; lower the visual prominence of each card container
- [x] Options — clean up title and description; remove local option editor; align Add option button with Expenses pattern; remove any default/pre-seeded option before user adds one; support archive and delete-from-archive
- [x] Ideas — clean up title and description; remove local idea editor; align Add idea button with Expenses pattern; remove any pre-existing inline item/editor before user adds one; support archive and delete-from-archive
- [x] Tasks — follow the same add/archive/delete pattern as Expenses; remove any pre-seeded new-task item before user adds one
- [x] Bundle the clarified spec into grouped implementation handoffs and sequencing docs for the fleet
- Interim misses noted and resolved before final signoff: first-pass review caught a few copy/title mismatches, archive/delete behavior gaps, and lingering default/pre-seeded item behavior that did not fully match the clarified request.
- Final state: follow-up fixes landed, final review approved the pass, and the board is now closed as completed.

## 2026-07-07 Expenses Pattern Audit — Approved/Complete
Mission: Audit every Expenses-pattern page for add-button placement and archive/delete/delete-all support, document the current state, and route the follow-up implementation work across the fleet. Final approval is now in place and the sweep is closed.
- [x] Audit `Expenses`, `Budget`, `Debt`, `Decisions`, `Options`, `Ideas`, `Tasks`, and `Risks` for upper-right add-button placement
- [x] Audit the same pages for archive, delete, and delete-all behavior
- [x] Record findings in `docs/expenses-pattern-audit-2026-07-07.md`
- [x] Propose fleet routing for pattern-definition, placement normalization, archive-policy decisions, and QA
- [x] Decide whether `Budget` and `Risks` should join the archive lifecycle or remain intentional exceptions
- [x] Decide whether `Delete all` is a required affordance on every archive-capable page or only on selected pages
- Interim review misses noted before approval: the first review pass left a couple of archive-policy decisions and page-pattern inconsistencies unresolved, so the sweep stayed open until those gaps were explicitly documented and routed.
- Final state: the interim misses were captured, follow-up direction was approved, and the expenses-pattern sweep is now closed as completed.

## Next Milestone  Route Map as Planning Control Center  Proposed
Mission: Make Dashboard route-map items reliable, sequential, persistent, and impossible to miss while preserving the compact two-column roadmap UX.
- [ ] Persist route-map item archive / restore state in localStorage so archived roadmap requirements survive reloads.
- [ ] Add early airline feasibility requirement under Research and leave ticket purchase under Travel so flight work is surfaced months before departure.
- [ ] Add clear route requirement ownership for Work, Tax & Banking and Healthcare & Insurance in the Tasks trigger library; currently route-progress has these categories but Tasks trigger sections do not.
- [ ] Reconcile `LANDMARKS`, `route-progress.ts`, and Tasks trigger-library category definitions into one shared roadmap/category source so labels, order, and links cannot drift.
- [ ] Add route-map row-pair behavior tests to `verify:route-map` or a dedicated Playwright script instead of relying on ad-hoc verifier scripts.
- [ ] Add visual verification screenshots for expanded/collapsed route-map rows, archive state, inactive state, and mobile width.
- [ ] Review route-map archive semantics: decide whether archived requirements should affect progress or only hide/de-emphasize work.

## Next Milestone  Local Data Reliability & State Architecture  Proposed
Mission: Reduce localStorage drift, duplicate persistence code, and silent data loss risks across editable pages.
- [ ] Create a shared typed storage helper for localStorage read/write, migration, fallback, and error reporting.
- [ ] Add schema validation for stored Tasks, Decisions, Budget, Expenses, Debt, Ideas, Options, Risks, M4 Planning, and Calendar data.
- [ ] Add one data integrity script that checks seeded IDs, route requirement task IDs, decision IDs, and storage-key consistency.
- [ ] Add import/export backup flow for all local app state, not just print/JSON snapshot slices.
- [ ] Add storage quota / IndexedDB failure messaging for recordings and large archived sessions.
- [ ] Decide whether route-map archive state, roadmap requirements, and task board should share one durable task model or remain UI-specific state.

## Next Milestone  Conversation Pipeline Hardening  Proposed
Mission: Make recording, Whisper transcription, 9router parsing, and dispatch-to-tasks/decisions easier to trust and recover.
- [ ] Remove dead Web Speech transcription code and stale comments now that Whisper API is the real path.
- [ ] Rename stale `LM_STUDIO_URL` constants/comments to 9router/OpenAI-compatible endpoint naming.
- [ ] Add endpoint health indicators for Whisper `localhost:8000` and 9router `localhost:20128` before recording or retry.
- [ ] Add parser output preview / confirmation before sending parsed tasks and decisions into live pages.
- [ ] Add duplicate-detection when dispatching parsed action items so repeated retries do not create duplicate tasks/decisions.
- [ ] Add tests for transcription failure, parser failure, retry from saved blob, retry from cached labeled transcript, and stale-session prevention.
- [ ] Add archive search/filter for recorded conversation sessions by task, owner, date, and parse status.

## Next Milestone  Page Consistency & Navigation Cleanup  Proposed
Mission: Clean up remaining page drift and dead surfaces so nav, route-map, and editable pages agree.
- [ ] Remove or fully restore `DocumentsView`; current file is a null stub while roadmap still has a Documents category.
- [ ] Decide whether Documents returns as a real page or remains task-only; align nav, route-map links, snapshot type, and Tasks trigger library accordingly.
- [ ] Add missing Tasks trigger-library sections for Work, Tax & Banking and Healthcare & Insurance.
- [ ] Review `ViewKey` for obsolete values like `roadmap` / `snapshots` that are not exposed in current navigation.
- [ ] Normalize archive/delete/delete-all behavior across Budget, Debt, Expenses, Decisions, Options, Ideas, Tasks, and Risks.
- [ ] Normalize modal form layout and row actions across all editable ledger pages.
- [ ] Add empty-state copy audit for every page so blank states explain the next useful action.

## Next Milestone  Verification & Developer Quality Gates  Proposed
Mission: Turn repeated manual/ad-hoc checks into fast repeatable project commands.
- [ ] Add `npm run typecheck` as explicit documented quality gate alongside `npm run build`.
- [ ] Add focused Playwright verification scripts for Dashboard, Tasks trigger routing, conversation pipeline, archive lifecycle, and route-map interactions.
- [ ] Add regression coverage for localStorage migrations and malformed stored JSON recovery.
- [ ] Add screenshot-backed visual verification workflow for the Dashboard route map at mobile and desktop widths.
- [ ] Add CI/local script that starts an isolated Vite server, runs verifiers, and cleans up automatically.
- [ ] Pin package versions or lock install policy if repeatable local verification continues to matter.

## Backlog
- Fix "Move Map" branding in upper left NavRail: change `.brand` CSS from pill-shaped (border-radius: 18px, gradient bg) to clean rectangular box (border-radius: 4px, solid bg)
- Continue route-map polish on Home only; the standalone `RoadmapView` was intentionally removed.
- Add deeper budget tracking view polish.
- Add deeper decisions tracking view polish.
- Add deeper options comparison view polish.
- Add deeper ideas and conversation prompts view polish.
- Add deeper tasks/checklist tracking view polish.
- Add deeper risks tracking view polish.
- Add deeper documents tracking view polish.
- Add generated PDF export plan for a later milestone.
- Consider in-app editing after M1 review.
- Consider SQLite only after manual JSON editing becomes too limited.
- Add a local data integrity script if manual JSON editing continues.
- Pin package versions if repeatable installs become important.

## ✅ Done
- Define the product concept and information architecture.
- Research Barcelona relocation requirements for a US family.
- Research visa/residency options.
- Research estimated budget categories and cost-of-living planning areas.
- Define roadmap phases from now to January 2027.
- Define visual direction for the first dashboard prototype.
- Choose local data storage format for M1: JSON-only.
- Create M1 build plan.
- Review M1 build plan before implementation.
- Build the first local read-only web app prototype.
- Add M1 roadmap view.
- Add M1 budget view.
- Add M1 decisions view.
- Add M1 options comparison view.
- Add M1 ideas view.
- Add M1 tasks/checklist view.
- Add M1 risks view.
- Add M1 documents view.
- Add M1 export/snapshot support with browser print and JSON download.
- Review M1 implementation for privacy, local-only behavior, exports, usability, and maintainability.
- Fix M1 seed-data relationship note by adding `task-family-priorities`.
- Close M1 prototype milestone as shipped/approved with notes.
- Defer audio recording and transcription for M2 unless later approved as a separate low-risk slice.
- M2: Add archive/history controls for conversation sessions
- M3: Formal review pass to ship as approved
- M2 conversation mode for Nate and Shae.
- M4: Polish pass + review to ship as approved — Klerik SHIP READY, no fixes needed.
- Conversation Recording & Transcription feature — COMPLETE (Phases 0-4, all Klerik-approved)
  - Phase 0: Types & services (audio-recorder, audio-store, transcription-service, state-events) — APPROVED
  - Phase 1: Recording UI (RecordingControls, useRecording hook, ConversationView integration) — APPROVED after mic-leak fix
  - Phase 2a: Web Speech transcription (transcription-service, TranscriptView, TranscriptionSettings) — APPROVED after segment-ID fix
  - Phase 3: Transcript parsing + cross-page dispatch (transcript-parser, TranscriptParserPanel, Tasks/Decisions sync) — APPROVED after draft-preservation fix
  - Phase 4: Polish & edge cases (mic denial, archive playback, recording delete, empty states, a11y) — APPROVED
  - Final holistic review: APPROVED (Klerik fixed parseTranscript throw-on-failure during review)
- Conversation Recording — Transcription & Parsing Pipeline Fix (2026-07-08/09) — COMPLETE, Klerik-approved
  - Root cause: Web Speech API silently failed on Edge + LM Studio (localhost:1234) offline → "No speech detected — nothing to analyze"
  - Chizul: replaced live Web Speech with post-recording Whisper API (localhost:8000/transcribe) + switched LLM parse from LM Studio to 9router (localhost:20128, cx/gpt-5.4-mini)
  - New flow: Record → save blob to IndexedDB → Whisper transcribe → 9router parse → auto-archive (no manual Parse button, no live transcript text — waveform only)
  - Klerik review: CHANGES_REQUIRED → RESOLVED. Fixed blocking bug (Whisper/network failure was masked as "No speech detected" and Retry could never recover). Now surfaces distinct "Transcription service unavailable — check localhost:8000" error; Retry re-runs full Whisper→parse from saved blob
  - Verified: `npm run build` passes (375.13 kB); Whisper accepts audio/webm;codecs=opus (recorder's format); 9router returns structured JSON; UI renders with 0 console errors
  - Follow-up (deferred to Chizul): remove dead Web Speech code (WebSpeechTranscription, createTranscriptionService, isTranscriptionSupported); clean stale comments/const names (LM_STUDIO_URL, "Phase 2b stub")
- Conversation Recording — Speaker Attribution ("who holds the floor") (2026-07-09) — COMPLETE, Klerik-approved
  - Feature: button-driven speaker attribution. When the user presses the speaker-toggle / interrupt buttons during recording, the transcript sent to the LLM is labeled per-speaker (Nate:/Shae:), so action items/decisions/questions are attributed to the right person via the parser's existing owner field (Nate/Shae/shared).
  - This is MANUAL button-driven attribution, NOT acoustic voice diarization.
  - Chizul: added WhisperSegment type + transcribeWithSegments()/transcribeRecordingWithSegments() (keeps segment timestamps); floorLogRef + durationSecondsRef (closure-staleness fix); speakerAtTime() + buildLabeledTranscript() helpers; switchSpeaker/interrupt append floor entries; handleRecord resets floor log; transcribeAndParse builds labeled transcript; one sentence added to parser SYSTEM_PROMPT about speaker labels.
  - Fallback rule: starting speaker before first toggle, nearest floor-holder thereafter — never "Unknown".
  - Klerik review: CHANGES_REQUIRED → RESOLVED. Fixed stale-state bug: handleRecord reset the floor log but not lastRecordingRef/lastTranscriptTextRef, so a Retry after a failed Whisper run in a NEW session could re-parse a PRIOR session's labeled text and mis-attach it. Fixed by clearing both caches on new-session start.
  - Verified: `npm run build` passes (376.53 kB); Whisper returns real per-segment start/end timestamps (confirmed via macOS `say`→webm test); floor-log timebase aligns with Whisper segment times (both freeze on pause).
  - CAVEAT: attribution accuracy depends on the user toggling the speaker button when the floor changes; out-of-turn speech without a toggle is attributed to the current floor holder.

### UI Alignment Pass — Complete
Mission: Fleet-wide UI alignment pass across all dashboard pages. Standardize on popup modals for add/edit flows, remove EUR currency references where $ is the target, remove footer disclaimer text, remove the Documents page, and apply targeted styling polish. All 10 grouped changes reviewed and approved by Klerik (PASS ✅). Build passes cleanly.
- [x] Remove footer disclaimer text from AppShell.tsx — `Content change`
- [x] Remove entire Documents page (DocumentsView.tsx, App.tsx routing, NavRail.tsx nav) — `Content change`
- [x] Remove EUR references from Budget page, keep only $ — `Remove EUR`
- [x] Add button → popup modal on Budget page (follow Expenses pattern) — `UI pattern alignment`
- [x] Remove inline blank slate from Budget page for new budget items — `UI pattern alignment`
- [x] Remove EUR references from Expenses page, keep $ only — `Remove EUR`
- [x] Add button → popup modal on Debt page (follow Expenses pattern) — `UI pattern alignment`
- [x] Replace pill/bubble styling on Debt Nate/Shae columns with plain text — `UI pattern alignment`
- [x] Add delete capability to Debt Archive section — `UI pattern alignment`
- [x] Remove "next action" piece from Income & Housing page — `Content change`
- [x] Make status pills lower profile / less prominent on Income & Housing — `UI pattern alignment`
- [x] Highlight the selected planning control pill on Income & Housing — `UI pattern alignment`
- [x] Add button → popup modal on Decisions page — `UI pattern alignment`
- [x] Restore gold background styling on Decisions page — `UI pattern alignment`
- [x] Make items smaller and more compact on Decisions page — `UI pattern alignment`
- [x] Convert add-options button on Options page to popup dialog — `UI pattern alignment`
- [x] Remove clear-all button from Options page — `Content change`
- [x] Keep category filter active/persistent in view on Options page — `UI pattern alignment`
- [x] Remove local inline idea editor from Ideas page — `Content change`
- [x] Keep add-idea button → popup dialog on Ideas page like other pages — `UI pattern alignment`
- [x] Add button → popup modal on Risks page matching other page patterns — `UI pattern alignment`
