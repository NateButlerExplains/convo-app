# Status

## Initial State
Project scaffold created for a private Barcelona relocation planning dashboard.

## Current Goal
M1 prototype is shipped/approved with notes. Next work should be limited to optional polish or a separately approved M2 scope.

## Current Assumptions
- Move target: January 2027.
- Origin: Malden, Missouri.
- Destination: Barcelona, Spain.
- Family: Nate, wife, and three-year-old child.
- App runs locally on localhost and is not published online.
- Nate is the only direct updater.
- M1 uses local JSON seed data with read-only browser views and manual editing.
- M1 exports use browser print/save-as-PDF and local JSON snapshot download.

## Current Status
- M1 prototype implementation exists under `app/` and is approved with notes.
- The prototype uses Vite, React, TypeScript, plain CSS, and local JSON data.
- Implemented views: Home, Roadmap, Budget, Decisions, Options, Ideas, Tasks, Risks, Documents, and Snapshots.
- Export support includes browser print/save-as-PDF styles and local JSON snapshot download.
- Klerik review 002 returned APPROVED WITH NOTES with no blockers.
- The only seed-data relationship note was fixed by adding `task-family-priorities`.
- Verification after the fix: `npm run typecheck` passed, `npm run build` passed, and the relationship spot check reported no missing relationships.
- M1 closeout is complete; optional follow-ups remain backlog items, not blockers.

## Open Questions / Later Scope
- Should Nate request visual polish after hands-on use?
- When should in-app editing be considered?
- When should generated PDFs be considered?
- When should SQLite be reconsidered if manual JSON editing becomes too limited?
