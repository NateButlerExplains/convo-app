# Next Focus Plan — Cleanup, Polish & Milestone Closeout

**Author:** Anser (project planner)
**Date:** 2026-07-06
**Context:** After M1 shipped/approved, three milestones (M2, M3, M4) need to reach shipped/approved status, and backlog polish items await.

---

## 1. Milestone Status Overview

| Milestone | Status | Formal Review? | Flag |
|-----------|--------|----------------|------|
| **M1** Prototype | ✅ shipped/approved | Klerik review done | Complete |
| **M2** Conversation Mode | 🔍 In review | No Klerik review | Missing localStorage for session archive |
| **M3** Family Timeline | ✅ Done (unreviewed) | No Klerik review | Feature-complete, needs formal ship |
| **M4** Income & Housing | 🟢 Active development | No Klerik review | Feature-complete, needs polish + review |

**Additional views** (Debt, Expenses) are also localStorage-backed editable views that emerged post-M1 — they need review/ship documentation too.

---

## 2. What Each Milestone Needs to Ship

### M3 — Family Timeline (CLOSEST TO SHIPPING)

**Status:** Feature-complete. The view has:
- Month-by-month calendar grid (Jul 2026 – Jan 2027)
- Drag-and-drop event rescheduling
- Modal add/edit/delete
- localStorage persistence
- Countdown to January 2027
- Agenda view grouped by month

**Needed to reach shipped/approved:**
1. ✅ Check `npm run build` passes
2. ✅ Quick maintainability scan (any dense JSX, any edge cases)
3. ⬜ **Klerik review** — code quality, privacy, localStorage hygiene
4. ⬜ Update `tasks/kanban.md` → move to Done
5. ⬜ Update `memory/decisions.md` with durable decision
6. ⬜ Update `docs/status.md` with M3 shipped summary

**Estimated effort:** Small. ~1 agent to review + 1 to document.

---

### M2 — Conversation Mode

**Status:** The view is architecturally complete (session timer, speaker tracking, note queue, interrupt tokens, session end/archive flow), but **archived sessions are stored only in component state** — they vanish on page refresh.

**Needed to reach shipped/approved:**
1. ⬜ **Chizul**: Add localStorage persistence for archived sessions (load on mount, save on end)
2. ⬜ **Chizul**: Add an archive "clear all" / "export" action
3. ⬜ **Klerik**: Review code quality, privacy, persistence behavior
4. ⬜ Update `tasks/kanban.md` → move to Done
5. ⬜ Update `memory/decisions.md`
6. ⬜ Update `docs/status.md`

**Estimated effort:** Medium. Persistence is small but touches component lifecycle.

---

### M4 — Income & Housing Planning

**Status:** Actively developed. Full CRUD, localStorage persistence, filtering, archive/restore, ellipsis menus. Verified: `npm run build` passes.

**Needed to reach shipped/approved:**
1. ⬜ Polish pass (see section 3 below)
2. ⬜ **Klerik review**
3. ⬜ Update `tasks/kanban.md` → move to Done
4. ⬜ Update `memory/decisions.md`
5. ⬜ Update `docs/status.md`

**Estimated effort:** Small-medium. The view is solid; review + docs are the main path.

---

## 3. Polish Items (Quick Wins)

### Views needing deeper polish (from kanban backlog)

These are all visual/interaction refinement passes on existing M1 views:

| View | Polish Opportunity | Effort |
|------|-------------------|--------|
| **Roadmap** | Add milestone dependency arrows, richer status visualization, phase completeness bars | Medium |
| **Budget** | Add subtotals by category, collapsible sections, visual budget-range bar | Small |
| **Decisions** | Add timeline view of decisions by date, richer readiness ladder | Small |
| **Options** | Side-by-side comparison mode, category filter refinement | Small |
| **Ideas** | Discussion status filter, priority grouping, sort by priority | Small |
| **Tasks** | Track grouping with progress bars, due-date highlighting, dependency links | Medium |
| **Risks** | Likelihood × impact heatmap grid, mitigation status tracker | Medium |
| **Documents** | Status dashboard by person, expiration calendar view, apostille/translation quick-filter | Small |

**Quickest wins** (a few lines of CSS/JSX each):
1. **Decisions view** — already has strong card design; timeline ordering is low-hanging fruit
2. **Ideas view** — filter/sort controls are easy to add
3. **Options view** — category filter already exists; side-by-side is more work
4. **Documents view** — person/due-date quick-filters

### Non-view polish items
1. **M1 seed data cleanup** — Fix `milestone-family-priorities` → `task-family-priorities` relationship (noted in Klerik review)
2. **Package.json** — Pin explicit dependency versions (vs `latest`)

---

## 4. Critical Path

```
Week 1                    Week 2                    Week 3
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│ M3: Klerik review│────▶│ M2: Add localStorage│───▶│ M4: Klerik review│
│ M3: Document ship│     │ M2: Klerik review │     │ M4: Document ship│
│                  │     │ M2: Document ship │     │                  │
│     Also:        │     │                  │     │   Backlog:       │
│ - Fix seed data  │     │   Polish passes: │     │ - Decisions view │
│ - Pin versions   │     │ - Ideas view     │     │ - Documents view │
└──────────────────┘     │ - Options view   │     │ - Budget view    │
                         │ - Budget view    │     │ - Roadmap view   │
                         └──────────────────┘     └──────────────────┘
```

### Priority order for shipped/approved:
1. **M3 first** (closest to done, smallest delta)
2. **M2 second** (needs actual code change + review)
3. **M4 third** (active, needs polish + review)

### Polish priority (after milestones ship):
1. Seed data fix (5-minute task)
2. Decisions view polish (smallest effort, biggest visual impact)
3. Ideas view polish (filter/sort)
4. Budget view polish (subtotals)
5. Documents view polish (person quick-filter)
6. Roadmap/Risks/Tasks polish (medium effort)

---

## 5. Agent Assignment Sequence

| Phase | Agent | Task | Est. Effort |
|-------|-------|------|-------------|
| **Phase 1** | **Klerik** | Review M3 (Family Timeline) — code quality, privacy, localStorage | 30 min |
| | **Kashik** | Document M3 shipped: update `kanban.md`, `status.md`, `decisions.md` | 15 min |
| | **Chizul** | Fix seed data relationship (`milestone-family-priorities` → `task-family-priorities`) | 5 min |
| | **Chizul** | Pin package.json versions | 10 min |
| **Phase 2** | **Chizul** | Add localStorage persistence for M2 conversation session archive | 30 min |
| | **Nous-girl** | Quick visual polish: Ideas view (filter/sort), Options view refinements | 45 min |
| | **Chizul** | Implement polish for Ideas, Options, Budget views | 1 hr |
| **Phase 3** | **Klerik** | Review M2 (Conversation Mode) including new persistence | 30 min |
| | **Kashik** | Document M2 shipped | 15 min |
| **Phase 4** | **Chizul** | M4 polish pass: edge case handling, UX refinements | 1 hr |
| | **Klerik** | Review M4 (Income & Housing Planning) | 30 min |
| | **Kashik** | Document M4 shipped | 15 min |
| **Phase 5** | **Nous-girl** | Design review: Decisions, Documents polish concepts | 30 min |
| | **Chizul** | Implement Decisions, Documents, Budget polish | 1 hr |
| | **Klerik** | Quick review of polish changes | 15 min |
| **Phase 6** | **Crow** | Research (if needed): Barcelona income benchmarks, housing market data | As needed |
| | **Chizul** | Roadmap polish, Risks heatmap, Tasks progress bars | 1.5 hr |
| | **Kashik** | Final status summary: what's shipped, what remains | 15 min |

---

## 6. What to Do First (Immediate Next Steps)

1. **Klerik: Review M3 (FamilyTimelineView.tsx)** — this is the smallest gap to shipped/approved
2. **Kashik: Document M3 shipped** — update kanban, status, decisions
3. **Chizul: Fix the M1 seed data relationship gap** — `milestone-family-priorities` → missing `task-family-priorities`
4. **Chizul: Add localStorage persistence to M2 ConversationView archive** — archived sessions should survive page refresh

---

## 7. Risk & Notes

- **M2 audio/transcription**: Deferred per M1 decisions. No need to discuss unless explicitly re-requested.
- **Expenses/Debt views**: These emerged post-M1 as localStorage-backed editable views. They should be reviewed alongside M4 or as a separate cleanup wave. They work but have no formal milestone.
- **PDF export**: Remains deferred per earlier decisions. Not a blocker.
- **SQLite**: Not needed until in-app editing becomes too complex for JSON+localStorage. Not a blocker.
