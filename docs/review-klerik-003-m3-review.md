# Klerik Review 003: M3 Family Timeline

**Reviewer:** Klerik (review/safety agent)
**Date:** 2026-07-06
**File reviewed:** `app/src/views/FamilyTimelineView.tsx`
**Lines:** 281

---

## Blocker Issues (must fix before shipping)

### 1. Drag-and-drop event rescheduling is completely broken

**Severity:** HIGH — the feature visibly does nothing.

The drag data key written by `onDragStart` does not match the key used by `moveEvent` to locate the dragged event.

- **`onDragStart` (line 188)** stores: `event.date + event.label` (no separator)
- **`moveEvent` (line 92–96)** compares against: `event.date + "|" + event.label + "|" + event.type + "|" + event.note`

These formats will **never match**, so every drop silently fails — the event is never found in the array and no move occurs.

**Fix:** Store the same identifier format used by `dragItemId`:
```typescript
// OnDragStart should use:
e.dataTransfer.setData("text/calendar-event", dragItemId(event))
```

Or, simpler: store the event index or generate a stable ID field on each event at creation time.

### 2. React `key` collision for calendar items and agenda items

**Severity:** MEDIUM — causes duplicate-key warnings and incorrect DOM reconciliation.

Lines 188 and 207 use `event.date + event.label` as the React `key` prop. If two events have the same date and label (e.g., two "School drop-off" entries on the same day), React will treat them as the same element, causing rendering bugs (only one shows, or both merge).

**Fix:** Use the same composite key from `dragItemId` (date + label + type + note), or better, add a unique `id` field to each `CalendarEvent` and use that as the key.

### 3. `QuotaExceededError` not caught in `saveStoredEvents`

**Severity:** LOW-MEDIUM — silent crash and data loss if localStorage is full.

`saveStoredEvents` (line 45–48) calls `localStorage.setItem` without a try/catch. If the user's browser storage is full, this throws `QuotaExceededError` and the app crashes. No user-facing feedback is provided.

**Fix:** Wrap `setItem` in a try/catch, and optionally surface a user-visible warning (e.g., "Could not save — storage is full. Try exporting or clearing old data.").

---

## Warnings (should fix but not blocking)

### 4. `pendingAddDate` state variable is never written

Declared on line 83 (`const [pendingAddDate, setPendingAddDate] = useState<string | null>(null)`), used in the `defaultEntryDate` computation on line 87, but **never set to a non-null value anywhere** in the component. It's effectively dead code that adds confusion.

**Fix:** Remove `pendingAddDate` and its setter, and simplify `defaultEntryDate` to use `selectedDay ?? selectedDate ?? ...`.

### 5. `selectedDay` is redundant with `selectedDate`

Both state variables (`selectedDate` line 75, `selectedDay` line 82) are set to the same value in every mutation path (lines 93–95, 184, 239–241). They track the same information, creating a maintenance hazard where one could drift out of sync.

**Fix:** Consolidate into a single `selectedDate` state. Replace all `setSelectedDay(...)` calls with `setSelectedDate(...)` (or remove them if already redundant).

### 6. localStorage write + event dispatch on every modal keystroke

The `useEffect` at line 125 fires on every `drafts` change, including every keystroke inside the edit modal (lines 239, 245, 250, 255). This means:
- `localStorage.setItem` runs 10–50+ times during a single edit session.
- `notifyMoveMapStateChanged` dispatches a custom event that may cause other views to re-render unnecessarily.

This is wasteful but not destructive, since localStorage writes are synchronous and the final value is always correct.

**Fix:** Debounce the localStorage save (300ms), or skip the effect when the modal is open by tracking that with a ref.

### 7. Dead fallback `events` array at module scope

Line 26 declares `const events: CalendarEvent[] = [];` at module scope. It's used only as the fallback in `loadStoredEvents` (returned if localStorage is empty or corrupt). Since it's empty and never mutated, it works — but it's misleading, looking like it should hold data.

**Fix:** Replace `return events` with `return []` in both return paths of `loadStoredEvents`, and remove the module-level declaration.

### 8. Missing `aria-label` on the Delete button

The Delete button in the modal (line 227) has no `aria-label`. It displays only the text "Delete", which is adequate for most screen readers, but being explicit would be better for accessibility.

**Fix:** Add `aria-label="Delete event"` to the delete button.

---

## Suggestions (nice-to-have)

### 9. Add a unique `id` field to CalendarEvent

Currently, events are identified by a composite key of `date + "|" + label + "|" + type + "|" + note`. This is fragile — if the user edits a field, the identifier changes, making operations like drag-and-drop or delete fragile (delete currently works because it reads the key *before* the edit is applied in the modal, but it's still fragile). Adding a UUID or incrementing id at creation time would be more robust.

### 10. Debounce localStorage writes

For a smoother editing experience, debounce the `saveStoredEvents` call. A 300ms debounce on the drafts effect would reduce writes during fast typing while ensuring the final value is persisted. Consider using `requestAnimationFrame` or a simple `setTimeout`/`clearTimeout` pattern.

### 11. Keyboard accessibility for modal forms

The modal form fields don't use `<form>` with `onSubmit`, so pressing Enter in a text field won't save. Consider wrapping the form in a `<form>` element and adding an `onSubmit` handler to support keyboard submission.

### 12. `months` array could be computed from a start/end date

The months array (lines 14–22) is hardcoded from July 2026 to January 2027. If the timeline extends, this must be manually updated. Consider computing `months` dynamically from a configurable start date and range.

### 13. `onDragEnter` / `onDragOver` both set `dragTarget` on the same element

Line 171 sets `dragTarget` on `onDragEnter`, and line 172–175 sets it again on `onDragOver`. Since `onDragEnter` fires before `onDragOver`, the `onDragEnter` setter is sufficient. The redundant `onDragOver` setter can be removed.

---

## Verdict

**SHIP AFTER FIXES**

Three issues must be addressed before shipping:

1. **Drag-and-drop is non-functional** (blocker #1) — the key mismatch means events cannot be rescheduled by dragging. This is a core advertised feature ("Drag-and-drop event rescheduling") and silently does nothing.
2. **React key collision risk** (blocker #2) — duplicate-key warnings and potential duplicate-event rendering under the same date+label.
3. **QuotaExceededError crash risk** (blocker #3) — localStorage write crash with no user feedback.

The component is otherwise well-structured: it has solid error handling on load (`try/catch` + validation in `loadStoredEvents`), proper interval cleanup (`useEffect` return), no external API calls, no PII exposure beyond user-entered text, clean localStorage key naming, and a production build that passes without warnings.

Estimated fix effort: **~15 minutes** for all three blockers.

---

## Verification Summary

| Check | Result |
|-------|--------|
| `npm run build` | ✅ Passed (tsc + vite build, 152ms) |
| localStorage hygiene | ✅ Single key (`barcelona-relocation-calendar-events`), no data leaks, no PII |
| External calls | ✅ None — zero network requests |
|| Code quality | ⚠️ See blockers above — drag-and-drop broken, key collision risk, no quota handling |
|| Privacy | ✅ All data local, no analytics, no telemetry |
|| File size | 281 lines — moderate for a view with modal, DnD, countdown, and agenda |

---

## Re-review Verdict

**VERIFIED — All blockers resolved. Ready to ship.**

Checked each of the 3 blockers from the original review:

1. **Drag-and-drop (blocker #1) — ✅ Fixed.** `onDragStart` (line 192) now stores `dragItemId(event)` which produces the full pipe-delimited composite key (`date|label|type|note`). `moveEvent` (line 96) compares against the same `dragItemId(item)` format. The key mismatch is eliminated; drops will find and move the correct event.

2. **React key collision (blocker #2) — ✅ Fixed.** Both calendar items (line 192) and agenda items (line 211) use `key={dragItemId(event)}` — the full composite key including date, label, type, and note. No two events can share the same key unless every field is identical, which is semantically correct.

3. **QuotaExceededError (blocker #3) — ✅ Fixed.** `saveStoredEvents` (lines 47–51) now wraps `localStorage.setItem` in a `try/catch` block. On failure, it logs a descriptive `console.warn` message guiding the user to clear storage.

**Build:** `npm run build` passes cleanly (tsc + vite, 58ms).
