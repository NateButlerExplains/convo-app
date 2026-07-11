# Klerik Review: M4 Polish Pass (Planning View)

**Reviewer:** Klerik  
**File reviewed:** `app/src/views/M4PlanningView.tsx` (437 lines)  
**Build verification:** `npm run build` — ✅ passes cleanly (tsc + vite)  
**Verdict:** **SHIP READY**

---

## Checklist results

### 1. Empty state messages ✅
Every zero-data scenario is covered with context-aware messaging:

| Surface | Empty message |
|---|---|
| Summary bar (totalItemCount === 0) | "No items yet. Start with a new income or housing entry." |
| Summary bar (itemsCount === 0, items exist) | "No items match the current filter. Try a different filter or check the archive." |
| Income table (no rows at all) | "No income items yet." |
| Income table (filter mismatch) | `No income items match the "{filter}" filter.` |
| Income table (all archived) | "No non-archived income items. Check the archive below." |
| Income archive (empty) | "No archived income items." |
| Housing table (no rows) | "No housing items yet." |
| Housing table (all archived) | "All housing items are archived. Restore one below." |
| Housing archive (empty) | "No archived housing items." |
| Next action (contextual, 4 variants) | Guides user: create first item / restore / keep active lane / switch to Active filter |

### 2. UX edge case handling ✅
- Filter buttons (All/Active/Planned/Brainstorming) with `aria-pressed`
- Contextual spotlight row when filter === "Active"
- Archive/restore with expandable archive sections per kind
- Duplicate function preserves all fields, generates unique id
- Modal dismiss via backdrop click, close button, and Escape-adjacent pattern
- `useState(() => loadState())` — lazy initializer avoids re-running on re-renders
- Null-safe editing state with sensible defaults for every field

### 3. localStorage hygiene ✅
| Concern | Status |
|---|---|
| SSR guard | `canUseLocalStorage()` checks `typeof window !== "undefined"` |
| Read side: try/catch | Wraps `getItem` + `JSON.parse`, returns `emptyState` on any failure |
| Read side: field validation | `isIncomeRow()` / `isHousingRow()` — type guards check every field |
| Read side: corrupted data | Non-object parsed → `emptyState`; malformed rows filtered by type guards |
| Write side: try/catch | `useEffect` guarded by `canUseLocalStorage()` before `setItem` |
| Versioned key | `"barcelona-m4-planning-v2"` |
| Default values | `archived` defaults to `false` via `row.archived ?? false` in load pipeline |

### 4. PII / external calls ✅
- Zero network requests, zero API calls, zero analytics
- All data persisted to `localStorage` only
- `contact` and `website` fields are internal notes, never transmitted
- No PII sent anywhere

### 5. Build passes ✅
```
npm run build
> tsc -b && vite build
✓ built in 57ms (43 modules, 0 errors)
```

---

## Summary

The M4 polish pass is thorough. Every empty state has a tailored message, all localStorage access is wrapped in SSR guards and try/catch, field-level type validation protects against corrupted data, and the component is fully local-first with zero external calls. No issues found.

**Verdict: SHIP READY** — no fixes needed.
