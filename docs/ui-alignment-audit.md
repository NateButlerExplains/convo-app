# UI Alignment Pass — Audit Report

**Auditor:** Senter  
**Date:** 2026-07-06  
**Scope:** Compare the UI Alignment Pass deliverable against the user's original 10-item request, with special focus on cross-cutting archive-delete capability.

---

## Item-by-Item Findings

### 1. Budget page

| Requirement | Status | Evidence |
|---|---|---|
| Remove EUR, only keep $ | ✅ DONE | Currency `<select>` only has `USD` (line 219). Summary strip uses `formatCurrencyRange` with `"USD"`. |
| Actions section resembles Expenses page | ✅ DONE | Has `"New budget item"` button in a `calendar-actions` row (lines 167-176), matching ExpensesView toolbar pattern. |
| No blank slate new budget item on page | ✅ DONE | No inline draft form. Empty state shows a `"Nothing added yet"` card (lines 180-183). |
| Modal popup when add clicked | ✅ DONE | `isModalOpen` state toggles a modal with full fields (lines 262-338). |
| **Archive delete capability?** | ⚠️ N/A | BudgetView has **no archive concept** — items are permanently removed via `removeItem()`. Not applicable here. |

**Misses:** None on Budget's own scope. However, the cross-cutting "archive delete across all pages" requirement would need Budget to have archive functionality to begin with.

---

### 2. Debt page

| Requirement | Status | Evidence |
|---|---|---|
| New debt entry modal (like Expenses) | ✅ DONE | `isModalOpen` state renders a full modal (lines 281-345). |
| Nate/Shae columns: plain text, no bubbles | ❌ PARTIAL | Columns render as `<td><input>` elements (editable text fields, lines 182-193). **ExpensesView** uses plain `<td>` text — the user asked to follow that pattern. These are inline inputs, not bubbles, but also not plain text like Expenses. |
| Archive delete capability | ✅ DONE | Archive rows have a `Delete` button in the row-actions popover (line 202). `deleteRow()` function defined (line 151-154). |
| Archive delete across ALL pages | ❌ SEE BELOW | Only Expenses and Debt have it. M4PlanningView is missing it entirely. |

**Misses:** 
1. DebtView uses `<input>` cells instead of plain `<td>` text like ExpensesView does. The user specifically asked for plain text ("just text and not text and a bubble around the entries").

---

### 3. Remove footer text from ALL pages

| Requirement | Status | Evidence |
|---|---|---|
| Remove "Private localhost planning prototype..." | ✅ DONE | AppShell has no footer (20 lines total). `grep -ri "localhost\|Private localhost"` on `app/src` returns zero results. |

**Misses:** None.

---

### 4. Expenses page

| Requirement | Status | Evidence |
|---|---|---|
| Remove EUR, keep $ | ✅ DONE | Currency `<select>` only has `USD` (line 339-341). `money()` helper uses `$` prefix (line 91). |
| Archive delete | ✅ DONE | Archive rows have explicit `Edit`, `Restore`, and `Delete` buttons (lines 262-264). |

**Misses:** None.

---

### 5. Income & Housing Planning (M4)

| Requirement | Status | Evidence |
|---|---|---|
| Remove next-action from planning controls | ✅ DONE | The Planning Controls card (lines 229-257) has filters and add button only. The `nextHousing` variable (line 148) is computed but **never displayed** in the UI. |
| Low-profile pill-shaped status | ✅ DONE | Status is rendered as `<button>` with `m4-filter chip` class (line 236). Simple pill styling. |
| Selected item lit up when selected | ✅ DONE | Filter buttons get `is-selected` class (line 236). Spotlight rows get `is-spotlight` class (lines 282, 338). CSS defines `.is-spotlight` with highlight styling (styles.css line 575). |
| **Archive delete capability** | ❌ MISSING | **Neither income nor housing archive sections have a Delete button.** Income archive (lines 306-311): only Restore. Housing archive (lines 364-369): only Restore. No `deleteRow` function exists in M4PlanningView at all. |

**Misses:**
1. **🚨 CRITICAL: Archive delete missing in both income and housing archive sections.** The user explicitly said "Anytime I archive rows I want the ability to delete from the archived section. This should reflect across all the pages." M4PlanningView is the only page (besides Expenses and Debt) that has an archive section, and it has zero delete capability.

---

### 6. Decision page

| Requirement | Status | Evidence |
|---|---|---|
| Modal for add (like other pages) | ✅ DONE | `isModalOpen` state renders a modal (lines 210-275). |
| No inline new-decision form | ✅ DONE | No inline draft — items are added only via modal. |
| Gold background | ✅ DONE | `.decision-postcard` styled with `background: linear-gradient(145deg, #fff8e8, #f2dfc2)` in styles.css (line 165). |
| Compact items, not huge | ✅ DONE | Items are `article.section-card.decision-postcard` — compact cards with no oversized padding. |

**Misses:** None.

---

### 7. Options page

| Requirement | Status | Evidence |
|---|---|---|
| Clear-all button removed | ✅ DONE | No "Clear all" anywhere in OptionsView. |
| Add options follows other pages' format | ✅ DONE | `isModalOpen` renders a modal with full form (lines 296-364). |
| New addition pops up in dialog | ✅ DONE | Modal pattern. |
| Category filter for active view | ✅ DONE | `toggleCategory()` function (lines 117-127) + filter bar with `category-chip` buttons (lines 147-173). |

**Misses:** None.

---

### 8. Ideas page

| Requirement | Status | Evidence |
|---|---|---|
| Local idea editor (inline add) removed | ✅ DONE | No inline new-entry form on the page. Add goes through modal. |
| Only keep add idea button | ✅ DONE | "Add idea" button at line 134 opens modal. |
| Pop up in a window | ✅ DONE | Modal (lines 245-282). |
| **Remaining inline editing** | ⚠️ NOTE | The "Local idea editor" heading (line 130) and the inline editing inputs inside existing idea cards (lines 209-232) remain. This is the same pattern used across all pages (inline editing of existing items). Not a miss per se. |

**Misses:** None.

---

### 9. Risks page

| Requirement | Status | Evidence |
|---|---|---|
| Same modal format as others | ✅ DONE | `isModalOpen` renders modal (lines 210-286). |

**Misses:** None.

---

### 10. Documents page

| Requirement | Status | Evidence |
|---|---|---|
| Remove entire documents page | ✅ DONE | `DocumentsView.tsx` just returns `null` with a comment "Documents page removed as part of UI alignment pass." |
| Remove from navigation | ✅ DONE | `NavRail.tsx` items array (line 4) does not include `"documents"`. |

**Misses:** None.

---

## Cross-Cutting: Archive Delete Capability

This is the user's requirement from item 2: *"Anytime I archive rows I want the ability to delete from the archived section. This should reflect across all the pages."*

### Pages with archive sections — audited:

| Page | Has Archive? | Archive Delete? | Status |
|---|---|---|---|
| **ExpensesView** | ✅ Yes | ✅ Delete button (line 264) | ✅ DONE |
| **DebtView** | ✅ Yes | ✅ Delete in popover (line 202) | ✅ DONE |
| **M4PlanningView — Income** | ✅ Yes | ❌ No delete — only Restore (line 309) | ❌ MISSING |
| **M4PlanningView — Housing** | ✅ Yes | ❌ No delete — only Restore (line 367) | ❌ MISSING |

### Pages without archive concept (items deleted directly):

| Page | Has Archive? | Notes |
|---|---|---|
| BudgetView | ❌ No | Items removed permanently via `removeItem()` |
| DecisionsView | ❌ No | Items removed via `removeDecision()` |
| OptionsView | ❌ No | No archive |
| IdeasView | ❌ No | No archive |
| RisksView | ❌ No | No archive |
| TasksView | ❌ No | Items removed via `removeTask()` |

---

## Summary of Misses

| # | Severity | Item | Description |
|---|---|---|---|
| **M-1** | 🔴 CRITICAL | M4PlanningView archive delete | Neither income nor housing archive sections have a Delete button. The user explicitly required delete capability in all archive sections across all pages. |
| **M-2** | 🟡 MINOR | DebtView cell style | DebtView uses `<input>` elements for cell values instead of plain `<td>` text as seen in ExpensesView. User asked to "follow the lead of the expenses page" where cells display plain text, not editable inputs. |
| **M-3** | 🟢 COSMETIC | IdeasView heading | "Local idea editor" heading still present in hero-card section (line 130). User said to remove the local idea editor. The inline editing of existing items inside cards is standard across views, but the heading suggests a dedicated editor that no longer exists in the same form. |

---

## Items Missing That Were NOT in the Original Request

These are not official misses from the original 10 items but are worth noting:

1. **BudgetView "Clear all" button** — Still present (line 172). The user only asked to remove it from Options, but Budget has it too. Not a miss per the spec.
2. **M4PlanningView lacks a permanent delete function altogether** — Even for non-archived items, there's no way to permanently delete rows (only archive and restore).
3. **BudgetView no archive at all** — Items are either active or permanently deleted. No middle state (archive). If the user wants archive-delete across "all pages," Budget and the other non-archive pages may eventually need archive functionality added.

---

## Conclusion

**10 original requirements:** 7 fully done, 2 partial, 1 critical miss.

**What's correct:** EUR removal, footer removal, Documents stubbed, Decisions gold/compact, Modal pattern on all pages (Budget, Debt, Decisions, Options, Ideas, Risks), M4 pills/highlight/no-next-action, Options category filter, Expenses archive delete, Debt archive delete.

**What needs follow-up:**
1. **M4PlanningView archive delete (🔴 CRITICAL)** — Add delete capability to both income and housing archive sections. A `deleteRow` function needs to be implemented and Delete buttons added alongside Restore.
2. **DebtView cell style (🟡 MINOR)** — Consider switching from `<input>` cells to plain `<td>` text like ExpensesView to better match the requested "follow the lead of the expenses page" pattern.
|3. **IdeasView heading (🟢 COSMETIC)** — Consider updating the "Local idea editor" heading to something more neutral like "Idea cards" or "Brainstorming."

---

## Post-Audit Resolution

All gaps resolved and verified by Klerik. UI Alignment Pass: COMPLETE ✅
