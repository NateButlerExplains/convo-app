# deleg_002 - queued - ^chizul

ID: deleg_002
Status: queued
Target: chizul
Creator: senter
Owner: unclaimed
Review tier: Standard
Allowed actions: edit_project_files, run_local_commands
User approval: not_required
Created: 2026-07-06
Updated: 2026-07-06
Touched files:
- app/src/views/BudgetView.tsx
- app/src/views/ExpensesView.tsx
- app/src/views/DebtView.tsx
- app/src/views/M4PlanningView.tsx
- app/src/views/DecisionsView.tsx
- app/src/views/OptionsView.tsx
- app/src/views/IdeasView.tsx
- app/src/views/RisksView.tsx
- app/src/views/DocumentsView.tsx
- app/src/App.tsx
- app/src/components/AppShell.tsx
- app/src/components/NavRail.tsx
- app/src/types/move-map.ts
- app/src/styles.css

## Handoff

^chizul
Objective: Implement the UI Alignment Pass — a fleet-wide set of 10 grouped UI/UX changes across all dashboard pages. Standardize on popup modals for add/edit flows, remove EUR currency references where $ is the target, remove the footer disclaimer, remove the Documents page entirely, and apply targeted styling polish.

Context: All four milestones (M1–M4) are shipped/approved. The current dashboard has 13+ views with inconsistent interaction patterns. Some pages have inline editors, others have no add flow at all. Several pages still show EUR alongside USD. The footer disclaimer text is repeated on every page. The Documents page is unused and should be removed entirely. Detailed task descriptions are in tasks/kanban.md under the "UI Alignment Pass" section. Review tier is Standard because this touches code, config, and routing — Klerik review required before done.

Inputs:
- `tasks/kanban.md` — full UI Alignment Pass mission with all 10 items grouped by page, each tagged with change type
- `app/src/views/BudgetView.tsx` — needs EUR removal, popup modal, blank-slate removal
- `app/src/views/ExpensesView.tsx` — needs EUR removal only
- `app/src/views/DebtView.tsx` — needs popup modal, pill→text styling, archive delete
- `app/src/views/M4PlanningView.tsx` — needs "next action" removal, lower pills, highlight selected pill
- `app/src/views/DecisionsView.tsx` — needs popup modal, gold bg restore, compact items
- `app/src/views/OptionsView.tsx` — needs popup dialog, remove clear-all, keep filter active
- `app/src/views/IdeasView.tsx` — needs inline editor removed, add-idea popup dialog added
- `app/src/views/RisksView.tsx` — needs popup modal added
- `app/src/views/DocumentsView.tsx` — needs to be deleted or fully commented out
- `app/src/App.tsx` — remove DocumentsView import and `"documents"` case from switch
- `app/src/components/AppShell.tsx` — remove footer line with disclaimer text
- `app/src/components/NavRail.tsx` — remove `"documents"` from items array
- `app/src/types/move-map.ts` — remove `"documents"` from ViewKey union type
- `app/src/styles.css` — optional CSS cleanup for removed/changed elements
- `docs/conventions.md` — cross-agent naming/convention rules

Expected output: Edit the files listed above to implement all 10 work items. Run `npm run build` to verify zero TypeScript errors and zero build warnings. The documents page (`#documents`) should no longer be reachable from the nav or URL hash. The footer should be absent from all pages. EUR references should be gone from Budget and Expenses. Add/edit flows should consistently use popup modals (following the Expenses page pattern as reference). Inline editors on Ideas should be replaced with a popup dialog.

Verification:
1. `npm run build` passes with zero errors and zero warnings
2. Navigating to `#documents` falls through to `home` (default)
3. NavRail has no "Documents" link
4. Budget page shows only $ amounts, no EUR
5. Expenses page shows only $ amounts, no EUR
6. Budget page has a working add-button that opens a popup modal
7. Budget page has no inline blank-slate section for new budget items
8. Debt page has a working add-button modal, plain-text columns, and archive delete
9. Income & Housing page has no "next action" text, lower-profile pills, highlighted active pill
10. Decisions page has add-button modal, gold background styling, compact item sizing
11. Options page has popup dialog for add, no clear-all button, persistent category filter
12. Ideas page has no inline editor, add-idea opens a popup dialog
13. Risks page has add-button popup modal
14. DocumentsView.tsx is removed or fully commented out with a deprecation note

Memory updates: After Klerik approves, route to Kashik for status/memory consolidation. Update `docs/status.md` with the UI Alignment Pass completion and `memory/decisions.md` with key architectural decisions (e.g., why Documents page was removed, why EUR was dropped, what the Expenses popup pattern is).

## Progress Log

- 2026-07-06 - senter - Created and queued for Chizul.
