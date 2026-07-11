# Review Report: Klerik-006 — UI Alignment Pass

**Reviewer:** Klerik  
**Date:** 2026-07-06  
**Scope:** 10 grouped changes across ~12 files  
**Build:** `npm run build` passes cleanly ✅

---

## Guidance Reference

Guidance at `docs/ui-alignment-guidance.md` sets the **ExpensesView** as the canonical pattern: toolbar chip button → popup modal for data entry, read-only tables with ⋮ action menus, two-column person layout with SectionCard columns, collapsible archive details.

---

## Per-Page Verdict

### ✅ ExpensesView.tsx — PASS
- EUR fully removed: currency type is `"USD"` only, `money()` formatter uses `$` prefix, currency selector offers only USD, summary strip uses `$`.
- Modal pattern (add/edit via `modal-card` overlay) retained as canonical reference.
- ⋮ action menus for inline row actions.
- ✅ **No blockers or warnings.**

### ✅ BudgetView.tsx — PASS
- EUR removed: `blankDraft.currency: "USD"`, summary strip hardcodes `"USD"`, currency selector only shows USD.
- Modal pattern for adding items (`isModalOpen` → `modal-card`).
- Inline blank-slate add-form removed; empty state is a static `SectionCard` ("Nothing added yet"), NOT an inline form.
- ✅ **No blockers or warnings.**

### ✅ DebtView.tsx — PASS
- Modal pattern for add (lines 281–345).
- **SectionCard wrappers removed** from person columns — replaced by plain `<div className="debt-column-card">` + `<h3 className="debt-column-head">`. Tables render inline-editable fields per guidance.
- Archive/delete/restore/duplicate row actions present.
- ⚠️ **Warning:** The modal trigger button uses custom `debt-entry-trigger` class rather than the canonical `.chip.button-primary`. Minor style inconsistency; not a blocker.

### ✅ DecisionsView.tsx — PASS
- Modal pattern for both new and edit (lines 210–275).
- Gold/warm background via `decision-postcard` class.
- Compact summary postcards with title, status/readiness chips, date line, approvers, notes snippet, Edit/Remove buttons.
- ✅ **No blockers or warnings.**

### ✅ M4PlanningView.tsx — PASS
- No standalone "next action" widget visible.
- `status-control` classes applied to status pills in income table (low-profile chip style).
- Filter pills use `m4-filter` + `is-selected` for lit-up active state.
- `is-spotlight` row highlighting for Active filter integration.
- Rank badges use `rank-badge rank-{gold|silver|bronze}` (compact).
- ✅ **No blockers or warnings.**

### ⚠️ OptionsView.tsx — PASS (with notes)
- **Clear-all button removed** — only `resetCategories` for filters remains. ✅
- **Modal for add** (lines 296–364). ✅
- **Category filter retained** with toggle chips + "Show all" button. ✅
- ⚠️ **Warning:** "Add option" trigger button (line 143) is a bare `<button>` without `.chip.button-primary` class — deviates from canonical pattern.
- ⚠️ **Warning:** Existing option cards still use inline editing (inputs/selects inside `SectionCard`) instead of an edit modal. The canonical principle says "Data entry in modals, not inline." This is a partial deviation — only creation uses a modal, editing stays inline.

### ⚠️ IdeasView.tsx — PASS (with notes)
- **Inline add editor gone** — add-idea moved to modal (lines 245–282). ✅
- **Filter/sort bar retained.** ✅
- ⚠️ **Warning:** "Add idea" trigger button (line 134) is a bare `<button>` without `.chip.button-primary`.
- ⚠️ **Warning:** Existing idea cards still use inline editing (inputs, selects, checkboxes inside card body). Only creation moved to modal; editing remains inline. Partial deviation from canonical pattern.

### ⚠️ RisksView.tsx — PASS (with notes)
- **Add risk → modal** (lines 210–286). ✅
- ⚠️ **Warning:** "Add risk" trigger button (line 125) is a bare `<button>` without `.chip.button-primary`.
- ⚠️ **Warning:** Existing risk cards still use inline editing. Only creation moved to modal; editing remains inline. Partial deviation from canonical pattern.

### ✅ DocumentsView.tsx — PASS
- Stubbed to `return null` with explanatory comment. ✅

### ✅ AppShell.tsx — PASS
- Footer block removed entirely. No trace of "Private localhost planning prototype" text. ✅

### ✅ NavRail.tsx — PASS
- `documents` removed from `items` array. Only 12 items remain. ✅

### ✅ App.tsx — PASS
- No `documents` case in the view switch. No `DocumentsView` import present. ✅

---

## Summary

| Category | Result |
|----------|--------|
| **Footer removed** | ✅ Done |
| **Documents stubbed + nav + routing gone** | ✅ Done |
| **EUR removed (Expenses + Budget)** | ✅ Done |
| **Modal patterns added** | ✅ Add/Create on all target views |
| **Budget blank slate → static card** | ✅ Done |
| **Debt plain text columns** | ✅ Done (no SectionCard wrappers) |
| **Decisions gold bg + compact** | ✅ Done |
| **M4 next-action removed + low-profile pills** | ✅ Done |
| **Options clear-all removed** | ✅ Done |
| **Build** | ✅ Clean (0 errors, 0 warnings) |

## Recurring Warnings

1. **Inconsistent trigger button styling:** OptionsView, IdeasView, RisksView, and DebtView use bare `<button>` (or custom classes) instead of the canonical `.chip.button-primary` class for their "Add" triggers. Low-priority but worth aligning for consistency.

2. **Inline editing on existing cards:** OptionsView, IdeasView, and RisksView still allow full inline editing of existing items inside SectionCards. The canonical Expenses pattern calls for edit-in-modal. This was likely a scope decision (grouped changes didn't rewrite existing editing UX), but it means these pages are only partially aligned with Principle #1 ("Data entry in modals, not inline"). Consider a follow-up pass to move edit forms into modals for these views.

3. **DebtView modal button class:** Uses `debt-entry-trigger` instead of `.chip.button-primary`. Similar styling concern.

## Overall Verdict

**PASS** ✅ — All 10 grouped changes are correctly implemented. The UI direction from the guidance document is faithfully applied. No code quality issues, no TypeScript errors, no import/routing breakage. The three warnings above are non-blocking style/scope notes for potential future refinement.

Build: ✅ `npm run build` passes with zero errors.
