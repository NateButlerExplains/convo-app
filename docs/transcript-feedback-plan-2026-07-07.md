# Transcript Feedback Plan — 2026-07-07

Author: Senter
Source: clarified user spec for the latest feedback pass
Scope: planning + routing only. No product/code changes implemented.

## Current read

The earlier transcript triage has now been superseded by a clarified requirements list. This plan treats the pass as implementation-ready from a coordination standpoint, while still separating copy work, UI pattern work, and review.

## Grouped checklist

### 1. Shared shell + page copy alignment
- [ ] Home: change `BCN` to `Move Map`.
- [ ] Home: add a rectangular treatment around `Move Map`.
- [ ] Home: keep `Print` and `Download` side by side horizontally.
- [ ] Home/Roadmap: rewrite the homepage description so it matches what the homepage/roadmap section is actually about.
- [ ] Conversation: rewrite the copy under `The Big Trip` so it matches the Conversation page purpose.
- [ ] Calendar: rewrite the header/description so it matches the Calendar page purpose.
- [ ] Options: clean up the title.
- [ ] Options: rewrite the description so it matches what the section is actually about.
- [ ] Ideas: clean up the title and description so they clearly reflect Ideas, not "questions worth keeping."

### 2. Archive/delete pattern expansion
- [ ] Budget: add `Delete all` in the archive area.
- [ ] Options: support archive, then delete from archive.
- [ ] Ideas: support archive, then delete from archive.
- [ ] Tasks: support archive, then delete from archive.

### 3. Expenses-pattern alignment across planning pages
- [ ] Expenses: reduce the page to two sections/columns only, one for Nate and one for his wife.
- [ ] Expenses: ignore the earlier note about controls.
- [ ] Decisions: make the actions/add pattern follow the Expenses page.
- [ ] Options: clean up the Add option button so it follows the Expenses page pattern.
- [ ] Ideas: make the Add idea button follow the Expenses page pattern.
- [ ] Tasks: follow the same add/archive/delete pattern as Expenses.

### 4. Remove pre-seeded local editors/items
- [ ] Options: remove the local option editor.
- [ ] Options: ensure there is no default/untitled planning option before the user adds one.
- [ ] Ideas: remove the local idea editor.
- [ ] Ideas: ensure there is no pre-existing inline editor/item before the user adds one.
- [ ] Tasks: clean up the add flow so nothing is pre-seeded before the user adds one.

### 5. Decisions page compaction
- [ ] Decisions: remove the total number of decision cards from the header area.
- [ ] Decisions: make decision cards use less space.
- [ ] Decisions: make the bubble/container around each card more low-profile.

## Proposed implementation workstreams

### Workstream A — Copy + framing alignment
Scope:
- Home/Roadmap description
- Conversation subtitle/copy under `The Big Trip`
- Calendar header/description
- Options title/description
- Ideas title/description

Output:
- Final replacement strings with page-by-page mapping
- Any short UX notes if wording implies a label or header hierarchy change

Recommended agents:
- **Anser** for primary copy pass
- **Nous-girl** for optional tone polish if Nate wants warmer/more human wording without changing meaning
- **Senter** to lock final copy before implementation handoff

### Workstream B — Shared shell + page-level UI implementation
Scope:
- Home brand treatment and action layout
- Budget archive delete-all
- Expenses two-column simplification
- Decisions pattern alignment + compaction
- Options add-flow/archive changes
- Ideas add-flow/archive changes
- Tasks add-flow/archive changes

Output:
- Implementation patch set grouped by page or shared pattern
- Notes on any reused components or shared add/archive abstractions

Recommended agents:
- **Chizul** for implementation
- **Frieza** only if any local build/tooling issue blocks Chizul, otherwise not required on the first pass

### Workstream C — Quality review + acceptance
Scope:
- Verify page copy matches page purpose
- Verify Expenses-pattern alignment is consistent across Decisions, Options, Ideas, and Tasks
- Verify no page shows pre-seeded blank/local editors before user action
- Verify archive/delete flows behave correctly and do not regress existing data handling
- Verify Decisions visual density and lower-profile containers meet the request

Output:
- Review notes with pass/fail findings
- Regression callouts and any required fix list

Recommended agents:
- **Klerik** for mandatory review of implementation
- **Senter** to coordinate any fix loop and close the pass on the board

### Workstream D — Tracking + memory
Scope:
- Keep kanban and planning docs aligned with the clarified spec
- Capture any new cross-page UI convention if implementation changes the product pattern
- Record status after implementation/review closes

Output:
- Updated `tasks/kanban.md`
- Updated `docs/status.md` after implementation/review
- Durable notes in memory files only if conventions materially change

Recommended agents:
- **Senter** for active coordination docs
- **Kashik** after implementation to update status/memory

## Proposed routing plan

1. **Senter** locks this clarified spec as the source of truth and uses this doc + `tasks/kanban.md` as the implementation brief.
2. **Anser** produces the page-copy package for Home, Conversation, Calendar, Options, and Ideas.
3. **Senter** reviews and approves the copy package so implementation is not blocked by wording churn.
4. **Chizul** implements the grouped UI/content changes in this order:
   - shared shell + Home
   - Budget + Expenses
   - Decisions
   - Options + Ideas + Tasks
5. **Klerik** reviews the implementation pass for correctness, consistency, regressions, and pattern alignment.
6. **Chizul** handles any review fixes.
7. **Kashik** updates `docs/status.md` and durable project memory if the pass introduces stable UI conventions worth preserving.

## Recommended fleet fan-out
- **Implementation owner:** Chizul
- **Copy owner:** Anser
- **Optional tone/design polish:** Nous-girl
- **Review owner:** Klerik
- **Tracking/docs owner during pass:** Senter
- **Post-pass status/memory:** Kashik
- **Infra/tooling backup only if needed:** Frieza

## Notes for handoff quality
- Treat the Expenses page as the reference pattern for add/action/archive behavior across Decisions, Options, Ideas, and Tasks.
- Do not preserve any pre-seeded inline draft item/editor on Options, Ideas, or Tasks.
- For Expenses, the clarified spec supersedes the earlier controls note; keep the scope to the two spouse columns only.
- For Decisions, the request is both behavioral and visual: add-flow parity with Expenses plus smaller, lower-profile cards.
