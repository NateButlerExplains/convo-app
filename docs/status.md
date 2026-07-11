# Status

## Initial State
Project scaffold created for a private Barcelona relocation planning dashboard.

## Milestone Status

| Milestone | Status | Notes |
|-----------|--------|-------|
| M1 — Prototype | ✅ Shipped/approved | Core dashboard structure, local JSON seed data. Seed-data relationship note was a false positive — 9 tasks existed from the start. |
|| M2 — Conversation Mode | ✅ Shipped/approved | localStorage-backed conversation session archiving with try/catch, field validation, and clear-all button. Visual polish completed (Ideas filter/sort/priority groups, Options category/pros-cons). Klerik approved, build passes. |
| M3 — Family Timeline | ✅ Shipped/approved | Drag-and-drop calendar with localStorage persistence, countdown ticker, event add/edit/delete modal. Review blockers resolved. |
|| M4 — Income & Housing | ✅ Shipped/approved | Live-editable rows with localStorage persistence, filters (All/Active/Planned/Brainstorming), archive/restore, duplicate actions, ellipsis menus, contextual empty states. Klerik review: SHIP READY — no fixes needed. |
| Conversation Recording & Transcription | ✅ Shipped/approved | In-app audio recording (MediaRecorder → IndexedDB), Web Speech transcription (live + restart-on-silence), LLM parsing via LM Studio (localhost:1234) → action items + decisions, cross-page dispatch to Tasks/Decisions views, archive with audio playback. 5-phase build, all Klerik-approved. LM Studio Whisper endpoint NOT available — Web Speech used as primary path; local Whisper deferred to Phase 2b. |

## Current Goal
All four milestones (M1–M4) are shipped and approved. The current integration goal is complete in implementation and verification: the Home route rail now advances from live edits made on Tasks, Decisions, Budget, Income & Housing Planning, and Calendar. The obsolete standalone Roadmap page was removed; Home is the single route-map surface.

## Current Assumptions
- Move target: January 2027.
- Origin: Malden, Missouri.
- Destination: Barcelona, Spain.
- Family: Nate, wife, and three-year-old child.
- App runs locally on localhost and is not published online.
- Nate is the only direct updater.
- M1 established the local JSON seed-data prototype and the core dashboard structure.
- M2 shipped 2026-07-06 — provides localStorage-backed conversation session archiving with archive/history controls, clear-all button, and visual polish for Ideas (filter/sort/priority groups) and Options (category chips, pros/cons layout, meta strip).
- M3 was shipped 2026-07-06 — provides a drag-and-drop family calendar with localStorage-backed event persistence.
- M4 shipped 2026-07-06 — provides a localStorage-backed Income & Housing Planning view with editable rows, filters, archive/restore, duplicate actions, and contextual empty states. Klerik review: SHIP READY.
- All four milestones (M1–M4) are now shipped/approved, completing the cleanup cycle.

## Current Status
- M1 prototype implementation exists under `app/` and is approved with notes.
- The prototype uses Vite, React, TypeScript, plain CSS, and local JSON data.
- Implemented views include Home, Conversation, Calendar, Budget, Debt, Expenses, Decisions, Options, Ideas, Tasks, Risks, Snapshots, and Income & Housing Planning. Roadmap and Documents are not separate routed pages.
- M3 Family Timeline shipped 2026-07-06 after Chizul resolved three Klerik-review blockers (`dragItemId` consistency, try/catch on localStorage). Build passes cleanly.
- M2 Conversation Mode shipped 2026-07-06 — localStorage-backed archived session persistence, verified by Klerik with SHIP READY verdict. Build passes with zero errors.
- Visual polish for Ideas (filter/sort/priority grouping) and Options (category chips, pros/cons layout, meta strip) completed and approved by Klerik as part of the M2 review cycle. The unused `.filter-chip.active-amber` CSS class is harmless and available for future use.
- M4 shipped 2026-07-06 — editable income rows, housing rows, filters (All / Active / Planned / Brainstorming), add-new flow, archive sections with per-kind expandable lists, duplicate/archive actions, ellipsis menus, and contextual next-action guidance. Klerik verified and issued SHIP READY with no fixes needed.
- The UI title now uses `Income & Housing Planning` for the M4 page, while the top-level app title remains `The Big Trip`.
- Verification: `npm run build` passes cleanly, Klerik review confirmed zero issues.
- **July 7 Feedback Pass (2026-07-07)** — Final feedback pass is closed as approved/completed. The first implementation/review loop surfaced a few interim misses before signoff: copy/title mismatches across Home/Conversation/Calendar, archive/delete pattern gaps, and a couple of pre-seeded/default item behaviors that did not yet match the clarified spec. Those misses were addressed in the follow-up pass, and the final review approved the full feedback set as complete.
- **July 7 Expenses-Pattern Sweep (2026-07-07)** — The documentation/planning sweep is now closed as approved/completed. Interim review misses from the first pass centered on incomplete archive/delete/delete-all coverage decisions and a few page-pattern inconsistencies that needed one more clarification round before signoff. Those gaps were captured during the sweep, routed into the follow-up work, and the final approval closed the pass as complete.
- Audio recording, transcription, and automatic summary extraction remain deferred.
- **UI Alignment Pass (2026-07-06)** — Fleet-wide UI alignment completed across all dashboard pages. All 10 grouped changes reviewed and Klerik-approved with PASS ✅ verdict (build: zero errors). Completed:
  - Footer removed from AppShell.tsx; Documents page stubbed, nav/routing removed
  - EUR currency removed from Expenses and Budget (USD only)
  - Popup modal patterns added for add/create flows across Budget, Debt, Decisions, Options, Ideas, and Risks pages
  - Budget blank-slate inline form replaced with static SectionCard
  - Debt: SectionCard wrappers on person columns → plain text; archive delete added
  - Decisions: gold/warm background restored with compact summary postcards
  - Income & Housing: next-action removed, low-profile status pills, filter highlight
  - Options: clear-all removed, category filter retained
  - Ideas: inline editor removed, add-idea moved to modal
  - Risks: add-risk moved to modal pattern
  - 2 audit gaps (M4 archive sections missing Delete buttons; Debt cells using `<input>` instead of plain text) identified by Senter and fixed by Klerik — both verified ✅
  - Post-audit closeout: all 10 original user requirements fully delivered, all gaps resolved. UI Alignment Pass: COMPLETE ✅

## Realtime Route-Map Integration (2026-07-10)
- Home derives the first incomplete route checkpoint from the merged live snapshot rather than static `roadmap_phases.status` fields.
- Sequential requirements are controlled by editable records on Tasks, Decisions, Budget, Income & Housing Planning, and Calendar; Home shows the exact unmet requirement and links to its page.
- Same-window saves use `move-map:state-changed`; browser `storage` events refresh other tabs. Data remains local-first in browser storage—there is no server database or multi-device synchronization.
- Editable pages use seed records only when their local storage key is absent, so stable shared IDs remain editable without overwriting existing user data.
- Verification: trigger-map and Home guidance wiring are now aligned to real seed records (family priorities, family must-haves, visa assumptions, visa compare options, budget ranges, budget buffer, neighborhood shortlist, housing filters, school timing, school questions, document inventory, document deadlines, arrival checklist, arrival packet). Targeted ad-hoc verification passes for the wiring changes, but the repeatable browser flow still needs a fresh visual rerun after the verifier drift is cleaned up.
- Trigger-library UX milestone: Home-origin task jumps now scroll the target group into view, focus it, add a `From Home` badge, and apply a warm orange focus glow. Pending records remain visible but muted; current groups and conversation actions remain prominent.
- Production verification: `npm run build` still passes from earlier checks; current focus is visual/manual proof rather than Playwright automation.
- Independent Klerik review found the route-map integration concept sound; remaining work is proof cleanup and visual confirmation.

## Cleanup Cycle Summary (2026-07-05 → 2026-07-06)
- Fleet-wide eight-agent coordination cycle (Senter, Anser, Crow, Chizul, Klerik, Kashik, Nous-girl, Frieza) targeting M2, M3, and M4 for polish, review, and ship.
- **M2 Conversation Mode** — localStorage-backed archived session persistence with full try/catch guards, SSR guards, field-by-field validation (12 fields), clear-all button, individual delete. Visual polish for Ideas (filter/sort/priority grouping) and Options (category filter refinements, pros/cons visual layout, per-item meta strip) completed and Klerik-approved.
- **M3 Family Timeline** — Drag-and-drop month calendar with localStorage-backed event persistence, countdown ticker, event add/edit/delete modal. Three Klerik-review blockers resolved by Chizul (`dragItemId` consistency, try/catch on both reads and writes). Build passes cleanly.
- **M4 Income & Housing Planning** — Live-editable, localStorage-backed planning view with income rows, housing rows, filters, add/duplicate/archive/restore, ellipsis menus, contextual empty states. Klerik review: SHIP READY — no fixes needed.
- **Visual polish** — Ideas section gained filter/sort controls and priority grouping; Options section got category filter refinements and improved pros/cons visual layout with per-item meta strips.
- **Outcome:** All four milestones (M1–M4) now at ✅ shipped/approved. Project scaffolding and all views are in place.

## Open Questions / Later Scope
- Should Nate request visual polish after hands-on use?
- When should in-app editing be considered for other views?
- When should generated PDFs be considered?
- When should SQLite be reconsidered if manual JSON editing becomes too limited?
- Should conversation mode add local audio recording and transcription, or stay manual for now?
