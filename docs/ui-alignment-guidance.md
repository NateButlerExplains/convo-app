# UI Alignment Guidance — Visual Direction for Chizul

A concise reference for the UI alignment pass. Use the **Expenses view** as the canonical pattern for add-button → popup-modal flows across all pages. Below are page-specific direction notes.

---

## 1. Canonical Pattern Reference: ExpensesView

**File:** `app/src/views/ExpensesView.tsx`

**Why it's the standard:**

- **Toolbar button → popup modal.** The "New expense" chip button opens a clean `modal-card` overlay. The table stays read-only and scannable — data entry happens out-of-line.
- **Two-column person layout.** Each person (Nate/Shae) gets a `SectionCard` column with a `planning-table` inside. Summary meta (`expense-column-meta`) sits above the table.
- **Row actions via ⋮ menu.** Inline actions use a compact three-dot disclosure popover, not full row expansion.
- **Archive section** is a collapsible `details` element beneath each column.
- **Summary strip** at the top shows totals per person.

**Pattern to replicate everywhere:**
1. `.chip.button-primary` trigger in a toolbar or summary strip.
2. `modal-backdrop` → `modal-card` → `modal-head` + `modal-body` for data entry.
3. Table stays read-only (or minimally editable inline); heavy forms go in the modal.
4. Person-based views use side-by-side `SectionCard` columns.

---

## 2. Decisions View — Gold Background + Compact Items

**File:** `app/src/views/DecisionsView.tsx`

**Problem:** Each decision card embeds the full inline editing form, making cards extremely tall and bulky.

**Direction:**

1. **Gold/warm background.** Reuse the existing `.decision-postcard` style:
   ```css
   background: linear-gradient(145deg, #fff8e8, #f2dfc2);
   ```
   Apply this as the default background for decision cards — it's already defined in `styles.css` (line 165).

2. **Compact summary cards.** Show each decision as a small postcard with key fields only (title, status, readiness, dates). No inline form. Follow the Expenses pattern:

   - Decision card = compact `<SectionCard>` with `className="decision-postcard"`
   - Contents: title, status/readiness chips, date line, approvers, notes snippet
   - "Edit" / "Remove" buttons in `card-meta` footer

3. **Editing goes in a modal.** Clicking "Edit" opens the same `modal-card` pattern as Expenses — full form inside `modal-body`. The modal uses the decision's gold/warm accent via a subtle gradient in the `modal-head` or a border accent.

4. **"New decision" form** should also be a modal (not an inline SectionCard at the top). This matches the canonical pattern.

**Result:** A grid of small, warm, scannable postcards instead of tall inline editing panels.

---

## 3. Debt View — Plain Text Columns (No Bubble/Pill Containers)

**File:** `app/src/views/DebtView.tsx`

**Problem:** Each person's column is wrapped in a `SectionCard` (rounded card with background, border, shadow) — the user sees this as "bubble/pill containers" around each person's data.

**Direction:**

1. **Remove SectionCard wrappers** from the person columns. Render Nate and Shae data as plain columns under a single shared header instead.

   - Keep the two-column `debt-columns` grid layout.
   - Replace each `<SectionCard title={person} ...>` with a plain `<div>` or a minimal heading.
   - No rounded card background, no border, no shadow on the person containers themselves.

2. **Plain text column header.** Use a simple `<h3>` or `<div className="debt-column-head">` with just the person's name and total balance — no `SectionCard` chrome.

3. **Keep the table internals.** The `planning-table` inside each column stays as-is (inline editable fields are fine per-column). The change is only about how the *person column container* looks.

4. **Single entry modal.** The "New debt entry" button and modal already follow the Expenses modal pattern well — keep that. Consider moving the modal trigger up into a `.expense-toolbar`-style bar for consistency.

**Result:** A clean, text-forward two-column layout — data sits on the page surface without nested card containers.

---

## 4. Income & Housing (M4Planning) — Low-Profile Status Pills + Active Highlight

**File:** `app/src/views/M4PlanningView.tsx`

**Problem:** Status pills in the income table and filter buttons in the planning controls feel too prominent. The selected filter pill lacks a clear "lit up" active state.

**Direction:**

1. **Low-profile status pills** (the `status-control` buttons in the income table).

   These currently use status color classes (`status-active`, `status-planned`, `status-brainstorm`) that may be too bold. Dial them back:

   ```css
   .status-control {
     /* Base: subtle chip */
     font-size: 0.75rem;
     padding: 0.2rem 0.5rem;
     border-radius: 999px;
     border: 1px solid var(--line);
     background: rgba(255,255,255,0.4);
     color: var(--muted);
     font-weight: 600;
     cursor: pointer;
   }
   .status-control.status-active {
     /* Slightly more emphasis for Active — muted green or blue tint */
     background: rgba(111, 141, 115, 0.1);
     color: var(--sage);
     border-color: rgba(111, 141, 115, 0.25);
   }
   .status-control.status-planned {
     background: rgba(37, 92, 112, 0.06);
     color: var(--blue);
     border-color: rgba(37, 92, 112, 0.18);
   }
   .status-control.status-brainstorm {
     background: rgba(38, 49, 47, 0.04);
     color: var(--muted);
     border-color: var(--line);
   }
   ```

   Keep the `is-spotlight` row highlight for the "Active" filtered view — that's the visual priority mechanism.

2. **Filter pills — lit-up active state.** The filter buttons (`All`, `Active`, `Planned`, `Brainstorming`) need a clear **active highlight**:

   ```css
   .m4-filter { /* base: chip-like, low profile */ }
   .m4-filter.is-selected {
     background: var(--blue);
     color: white;
     border-color: var(--blue);
     box-shadow: 0 4px 12px rgba(37, 92, 112, 0.18);
   }
   ```

   When a filter is selected, it "lights up" (solid blue). Unselected filters stay muted (transparent background, subtle border). This gives clear 1-glance orientation for which planning status is active.

3. **Apply same principle to rank badges** (Gold/Silver/Bronze). Keep them compact — small rounded text labels, not large colored blocks. A subtle tint on the rank button is enough.

**Result:** The planning controls feel quiet and support-focused. The only loud element is the selected filter pill, which serves as wayfinding.

---

## 5. Text-Only Tweaks (Across Pages)

- **Expenses view:** Remove EUR option from the currency selector in the modal. Keep $ only. Update the `money()` formatter to always use `$`. Also remove EUR from the summary strip display.
- **Budget view:** Remove EUR, keep $ only. Remove inline blank-slate "new item" UI (follow the Expenses modal pattern for new items instead).

---

## Summary: Visual Principles

| Principle | Application |
|-----------|-------------|
| **Data entry in modals, not inline** | Every "New" / "Edit" action opens a popup modal. Tables stay compact and readable. |
| **Person columns = same width, side-by-side** | Nate and Shae share equal column space under a shared header rhythm. |
| **Use warm/paper palette** | `--paper: #f8f0df`, `--clay: #b96645`, `--sage: #6f8d73`, `--blue: #255c70`. Decisions get the gold gradient. |
| **Compact over spacious** | No giant cards, no inline editing sections filling the page. |
| **Status = low-profile pills** | Subtle color tints, small font, no heavy backgrounds. Only the active filter button "lights up." |
| **Person containers = text, not bubbles** | Debt person columns lose SectionCard wrappers. Plain headings + tables. |
