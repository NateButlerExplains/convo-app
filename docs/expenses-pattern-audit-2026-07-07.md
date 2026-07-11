# Expenses Pattern Audit — 2026-07-07

**Auditor:** Codex  
**Date:** 2026-07-07  
**Scope:** Audit every page currently using or approximating the Expenses-page interaction pattern for (1) upper-right add-button placement and (2) support for archive, delete, and delete-all behaviors. This is a documentation-only pass; no code changes are included.

---

## Baseline Pattern

`ExpensesView` is the reference implementation for this audit.

Core traits observed in `app/src/views/ExpensesView.tsx`:

- Add action exists as a single primary trigger outside the table (`New expense`).
- Archive is supported from active-row actions.
- Archived items can be restored or permanently deleted.
- There is **no** `Delete all` action.
- The add trigger is **not** in the upper-right hero/header position; it sits in a standalone toolbar below the page header.

Because the request specifically asks for upper-right placement, the baseline pattern is useful for archive/delete behavior but is not itself compliant on button placement.

---

## Audit Matrix

| Page | Add button in upper-right? | Archive support | Delete support | Delete-all support | Status |
|---|---|---:|---:|---:|---|
| `ExpensesView` | No | Yes | Yes | No | Partial |
| `BudgetView` | No | No | Yes | Yes | Partial |
| `DebtView` | No | Yes | Yes | No | Partial |
| `DecisionsView` | Yes | Yes | Yes | No | Partial |
| `OptionsView` | Yes | Yes | Yes | No | Partial |
| `IdeasView` | Yes | Yes | Yes | No | Partial |
| `TasksView` | No | Yes | Yes | No | Partial |
| `RisksView` | Yes | No | No | No | Partial |

---

## Page-by-Page Findings

### 1. Expenses

**File:** `app/src/views/ExpensesView.tsx`

- Add button placement: **Fail**
  - `New expense` is rendered in `expense-toolbar`, below the header, not in an upper-right hero/header action area.
- Archive support: **Pass**
  - Active rows support `Archive` from the row actions menu.
- Delete support: **Pass**
  - Active rows can be deleted directly.
  - Archived rows can also be permanently deleted.
- Delete-all support: **Fail**
  - No bulk delete action exists for active or archived expenses.

**Audit note:** This is the archive/delete reference pattern, but not the placement reference if the standard becomes upper-right.

### 2. Budget

**File:** `app/src/views/BudgetView.tsx`

- Add button placement: **Fail**
  - `New budget item` is embedded inside the summary strip `Actions` cell, not clearly in an upper-right header/hero slot.
- Archive support: **Fail**
  - Items are editable/removable, but there is no archived state.
- Delete support: **Pass**
  - Individual items can be removed with `Remove`.
- Delete-all support: **Pass**
  - `Delete all` exists inside the archive-style area.

**Audit note:** Budget supports direct delete and delete-all, but does not implement the archive lifecycle used by Expenses/Decisions/Options/Ideas/Tasks.

### 3. Debt

**File:** `app/src/views/DebtView.tsx`

- Add button placement: **Fail**
  - `New debt entry` lives in the summary strip, not upper-right in the page header/hero.
- Archive support: **Pass**
  - Active rows can be archived.
- Delete support: **Pass**
  - Active and archived rows can be deleted.
- Delete-all support: **Fail**
  - No bulk delete action exists.

**Audit note:** Behavior is strong on archive/delete, but placement does not match the requested upper-right standard.

### 4. Decisions

**File:** `app/src/views/DecisionsView.tsx`

- Add button placement: **Pass**
  - `New decision` is in the hero-card action area at the upper right.
- Archive support: **Pass**
  - Active cards can be archived.
- Delete support: **Pass**
  - Archived cards can be deleted; modal edit state also exposes delete.
- Delete-all support: **Fail**
  - No bulk delete action exists.

**Audit note:** This is the cleanest implementation of the desired placement plus archive/delete flow.

### 5. Options

**File:** `app/src/views/OptionsView.tsx`

- Add button placement: **Pass**
  - `Add option` is in the hero-card action area at the upper right.
- Archive support: **Pass**
  - Active options can be archived.
- Delete support: **Pass**
  - Archived options can be deleted; modal edit state also exposes delete.
- Delete-all support: **Fail**
  - No bulk delete action exists.

**Audit note:** Strong match for the target pattern except for missing delete-all.

### 6. Ideas

**File:** `app/src/views/IdeasView.tsx`

- Add button placement: **Pass**
  - `Add idea` is in the hero-card action area at the upper right.
- Archive support: **Pass**
  - Active ideas can be archived.
- Delete support: **Pass**
  - Archived ideas can be deleted; modal edit state also exposes delete.
- Delete-all support: **Fail**
  - No bulk delete action exists.

**Audit note:** Good alignment with Decisions/Options; only missing delete-all.

### 7. Tasks

**File:** `app/src/views/TasksView.tsx`

- Add button placement: **Fail**
  - `Add task` is in `expense-toolbar` below the header, mirroring Expenses rather than an upper-right hero action.
- Archive support: **Pass**
  - Active tasks can be archived.
- Delete support: **Pass**
  - Archived tasks can be deleted; modal edit state also exposes delete.
- Delete-all support: **Fail**
  - No bulk delete action exists.

**Audit note:** Tasks matches the old Expenses placement pattern, not the requested upper-right standard.

### 8. Risks

**File:** `app/src/views/RisksView.tsx`

- Add button placement: **Pass**
  - `Add risk` appears in the hero-card action area at the upper right.
- Archive support: **Fail**
  - No archive state or archive UI exists.
- Delete support: **Fail**
  - Existing risks are editable inline, but no delete action exists.
- Delete-all support: **Fail**
  - No bulk delete action exists.

**Audit note:** Risks shares the upper-right modal-entry pattern, but not the Expenses archive/delete lifecycle.

---

## Findings Summary

### Placement failures

These pages do **not** currently place the add button in the upper-right action area:

- `app/src/views/ExpensesView.tsx`
- `app/src/views/BudgetView.tsx`
- `app/src/views/DebtView.tsx`
- `app/src/views/TasksView.tsx`

### Archive/delete lifecycle gaps

Pages lacking some or all of archive/delete/delete-all support:

- `app/src/views/ExpensesView.tsx` — missing delete-all
- `app/src/views/BudgetView.tsx` — missing archive
- `app/src/views/DebtView.tsx` — missing delete-all
- `app/src/views/DecisionsView.tsx` — missing delete-all
- `app/src/views/OptionsView.tsx` — missing delete-all
- `app/src/views/IdeasView.tsx` — missing delete-all
- `app/src/views/TasksView.tsx` — missing delete-all
- `app/src/views/RisksView.tsx` — missing archive, delete, and delete-all

### Best current model for future alignment

If the product standard becomes:

1. add button in the upper-right hero area,
2. modal entry flow,
3. archive from active state,
4. permanent delete from archived state,
5. optional delete-all in archive section,

then `DecisionsView`, `OptionsView`, and `IdeasView` are closest to the desired structure and should be treated as the UI reference set rather than `ExpensesView` alone.

---

## Proposed Fleet Routing

This is a proposed implementation routing plan only.

### Route A — Pattern definition and acceptance criteria

**Owner:** Senter  
**Deliverable:** short alignment spec covering:

- what counts as an "Expenses-pattern" page,
- whether upper-right is now the canonical add-button location,
- whether `Delete all` is required on every archive-capable page or only selected pages,
- whether pages without archive today (`Budget`, `Risks`) should gain archive first or keep direct-delete semantics.

### Route B — Upper-right add-button normalization

**Owner:** Anser  
**Pages:**

- `app/src/views/ExpensesView.tsx`
- `app/src/views/BudgetView.tsx`
- `app/src/views/DebtView.tsx`
- `app/src/views/TasksView.tsx`

**Goal:** move add actions into the same upper-right hero/header treatment used by Decisions/Options/Ideas/Risks.

### Route C — Archive/delete/delete-all policy for archive-capable pages

**Owner:** Crow  
**Pages:**

- `app/src/views/ExpensesView.tsx`
- `app/src/views/DebtView.tsx`
- `app/src/views/DecisionsView.tsx`
- `app/src/views/OptionsView.tsx`
- `app/src/views/IdeasView.tsx`
- `app/src/views/TasksView.tsx`

**Goal:** decide and implement a shared archive footer/section policy, especially whether `Delete all` belongs in every archive section.

### Route D — Non-archive pages decision

**Owner:** Chizul  
**Pages:**

- `app/src/views/BudgetView.tsx`
- `app/src/views/RisksView.tsx`

**Goal:** recommend one of two directions:

- keep them intentionally outside the archive lifecycle, or
- upgrade them to full archive/delete/delete-all support so they participate in the same pattern family.

### Route E — QA / cross-page review

**Owner:** Klerik  
**Goal:** perform a final UI consistency audit after the above routes land, with a simple pass/fail matrix for placement and behavior.

---

## Recommended Sequence

1. Lock the pattern definition first.
2. Normalize add-button placement next.
3. Resolve archive/delete/delete-all behavior on archive-capable pages.
4. Decide whether Budget and Risks join the same lifecycle.
5. Run one final cross-page audit.

---

## Recommendation

The repo currently has **two overlapping patterns**:

- an older `Expenses/Tasks/Debt` style where the add action sits below the header, and
- a newer `Decisions/Options/Ideas/Risks` style where the add action sits in the upper-right hero area.

If the user wants a single standard, the newer hero-card placement should become canonical, and the archive/delete policy should be explicitly documented before implementation work starts.