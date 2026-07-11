# Conversation Page — Planning & Feasibility Analysis

**Author:** Anser · **Date:** 2026-07-08
**Context:** Complementary perspective on Nous-girl's creative brainstorm (`docs/conversation-page-ideas.md`). Where she explored *what could delight*, this doc examines *what connects, what flows, and what holds up under use* — patterns, data gaps, integration surfaces, and post-session value.

---

## 1. UX Patterns That Make a Session Feel Productive

Nous-girl nailed the core shift: the page should feel like a *shared planning journal*, not a stopwatch. Here's the structural UX layer that makes that real.

### 1.1 Session as a Bounded Work Unit, Not a Timer

The current model treats a session as "start → timer runs → pause/end → archive." This is a tape recorder metaphor. A more productive frame is **the meeting agenda pattern**:

- **Pre-fill the agenda** from cross-page data (open decisions, due tasks, unsaved brainstorm ideas) so the session starts with a purpose, not a blank clock.
- **Each agenda item tracks its own state**: queued → discussing → decided → deferred. The timer is background; the agenda progress is foreground.
- **On session end, prompt**: "X of Y items were discussed. Do you want to carry the remaining Y−X into the next session as a continuation list?"

This gives the session a **completion ratio** — a concrete sense of productivity rather than just elapsed time.

### 1.2 Speaker-Driven Layout (Physical Metaphor)

The two-column layout Nous-girl suggested ("What's on our mind" / "What we're capturing") maps perfectly to a real-life shared table. But to make it feel productive rather than split, add an implicit flow direction:

- **Left column (agenda)**: items start here. As one is discussed, it moves through stages.
- **Right column (capture)**: decisions, notes, and actions that *came from* the agenda item.
- **Footer strip**: the timer + speaking meter live here *below* the columns, always visible but not dominating.

Layout = process. Left = input (what we're talking about). Right = output (what we're creating). Bottom = awareness (how we're talking).

### 1.3 Persistent Draft State (Safe Abandonment)

A common blocker for real couples: "We don't have 45 minutes to do a proper session." The page should support **partial sessions**:

- A timer-less "scribble mode" where notes, decisions, and action items can be captured without starting the clock.
- The last draft state auto-saves to localStorage so closing the tab doesn't lose work.
- When a full session starts, scribble-mode items move into the agenda as "unresolved from scratch notes."

This removes the friction of *committing to a session* when you just want to capture a thought.

### 1.4 Undo / History for In-Session Actions

The current model is all-or-nothing: add a note, toggle resolved, end session. No undo. For a productive tool, the user needs:

- A brief **undo snackbar** after destructive actions ("Note deleted. Undo?").
- A simple in-session history panel that shows the event timeline (speaker switches, notes added, decisions captured, interrupts used) — useful for both review and accidental-action recovery.

---

## 2. Missing Data / Capture Flows

The existing data model covers speaking time, interrupts, notes (3 types), and a hardcoded actions/homework list. Here's what's absent.

### 2.1 Decision Capture (Full Cycle)

The note system captures *questions*, *ideas*, and *follow-ups* — but none of these model **a decision**. A decision is a distinct semantic object:

| Property | Why It Matters |
|---|---|
| **Title** (what was decided) | Non-editable, archival-quality text |
| **Alternatives considered** | Prevents "why did we pick this" re-litigation |
| **Assigned owner** | Nate, Shae, or both |
| **Confidence level** | Low/Medium/High — captures uncertainty |
| **Related topic tag** | Links to the agenda item that spawned it |
| **Supersedes** | References a prior decision this one replaces |

**Flow:** A note resolved as "Decided" becomes a draft decision card. The user can review/edit it before it's finalized. On finalize, it writes to both the session report and the Decisions page.

### 2.2 Action Items with Lifecycle

The current `actions` and `homework` arrays are hardcoded strings in `buildSessionReport()`. They're never editable, never assigned, never tracked. A proper action item needs:

- **Description** (user-authored, during session)
- **Owner** (Nate / Shae)
- **Status** (open → in progress → done)
- **Due-by** (optional date or "next session" tag)
- **Source** (which session it came from — session ID + timestamp)
- **Carry-over flag** (automatically true if status isn't "done" when session ends)

**Integration:** On session end, each open action item should sync to a task on the Tasks page, with a source backlink to the archived session.

### 2.3 Emotional Pulse — Structured, Not Just Ambient

Nous-girl's pre/post mood taps are excellent. To make them analyzable:

- **Mood scale**: Use a 5-point vector (Anxious → Calm, Overwhelmed → In Control, Distant → Connected, Pessimistic → Optimistic, Tired → Energized). Each pre/post session records all 5.
- **Per-topic emotion**: When a topic is discussed, optionally tag it with one or two of these dimensions. This creates enough structure to answer: "Which topics consistently spike anxiety?" or "Do post-session optimism scores correlate with balanced speaking time?"
- **No mandatory taps** — these are optional two-tap widgets, never modal or blocking.

### 2.4 Session Goals (Meta-Data)

Before starting, ask a single optional question: "What do you want to get out of this conversation?" Free-text, 1–2 sentences. This becomes the session's **goal statement** and serves as the archive's most scannable field for a future revisit: "Why did we have this talk?"

### 2.5 Topic Taxonomy

The existing note types (`question`, `idea`, `follow-up`) are capture-oriented, not content-oriented. Add a **topic tag** field to each note and decision:

- Housing · Visa · Budget · Timeline · Schools · Work · Feelings · Family · Documents · Logistics
- Multi-select. Extensible via a "+ New" inline tag creator.
- This powers the "sessions about housing" filter and the "haven't talked about X in a while" reminder.

---

## 3. Making the Session Report More Useful Post-Conversation

As it stands, the archived report shows raw data but offers no *insight* or *actionability*. Here's how to upgrade the end-of-session artifact.

### 3.1 Structured Summary Block (Top of Archive)

Replace the flat `details` expansion with an **executive summary card** at the top of each archived session:

```
┌─────────────────────────────────────────┐
│ Session: "Housing Budget Deep Dive"     │
│ ──────────────────────────────────────── │
│ 🎯 Goal: Set a firm monthly rent range   │
│ ⏱ 34 min · Balanced flow               │
│ ✅ 3 decisions · 2 action items open    │
│ ❓ 1 unresolved question                │
│ 📊 Mood shift: Anxious → Confident (+1) │
│ 🏷 Topics: housing, budget, timeline    │
│                                         │
│ [View full report] [Create tasks]       │
└─────────────────────────────────────────┘
```

This is scannable. It answers "what happened in that talk?" in under 3 seconds.

### 3.2 Decision Registry (Per-Session)

Beneath the summary, a specific **Decisions Made** block that lists only decisions, with confidence levels and alternatives considered. This is the most valuable post-hoc artifact — future arguments about "did we actually decide that?" are resolved here.

### 3.3 Action Item Status Dashboard

Persistent action items need a status block. The report should show:

- **New** (created this session)
- **Carried over** (from prior session, still open)
- **Completed** (resolved this session, regardless of origin)

This gives a sense of *momentum* — are we resolving old items faster than we create new ones?

### 3.4 Cross-Session Trend View (Aggregate)

The archive is currently a flat list. Add an **aggregate summary** across all sessions:

- Total sessions held, total conversation hours, sessions per week
- Most-discussed topics (by note/decision count per tag)
- Action item completion rate
- Mood trends (are post-session optimism scores improving?)
- Speaking balance trends (averaged across sessions, not per-session)

This aggregate isn't a report per se — it's a **dashboard widget** (see §4.3) that could live on the home page or Conversation page itself.

### 3.5 Exportability

A session report should be exportable as **Markdown** or **plain text** — useful for sharing with a third party (visa consultant, real estate agent) or attaching to an email. A one-click "Export this session" button at the top of the archived report.

---

## 4. Integration with Other Dashboard Pages

This is where the conversation page stops being an island and becomes the **nervous system of the dashboard**.

### 4.1 Conversation → Decisions (Bidirectional)

**Conversation page as Decision originator:**
- Decisions captured during a session should auto-create an entry on the **Decisions page**, with a `source` field linking back to the session ID.
- The Decisions page should show, for each decision, "Decided in session: [link to archived session]."

**Decisions page as conversation agenda:**
- Open/pending decisions appear as suggested agenda items in the pre-session builder.
- A decision with `lastDiscussed` older than 2 weeks gets a "warm back" flag.
- Decisions resolved as "Superseded" by a newer one should auto-cancel the older entry — the conversation replaces it.

### 4.2 Conversation → Tasks (One Direction + Carry-Forward)

**Task creation from action items:**
- Every action item that survives a session end should create a task on the **Tasks page**.
- The task carries: description, owner, source session ID, creation timestamp.
- Tasks page action: "Mark as done" optionally resolves the source session's action item too (bidirectional status).

**Scheduled carry-forward:**
- When a task from a prior session is incomplete and a new session starts, the pre-session agenda builder surfaces it: "You have 2 incomplete tasks from your last talk. Want to discuss or reassign?"

### 4.3 Conversation → Ideas / Brainstorm (Loop-Back)

**Ideas page as idea source:**
- Unsaved brainstorm ideas from the Ideas page appear as agenda suggestions: "You jotted down 'Visit Gracia neighborhood' last week. Want to discuss?"
- Notes captured as "idea" type should sync to the Ideas page when the session ends (deduplicated by text similarity or manual merge).

**Conversation as idea filter:**
- Not every idea from a session is good. After the session, the summary should ask: "Which ideas from this talk are worth keeping?" — moving only vetted ideas to the Ideas page.

### 4.4 Conversation → Dashboard Home (Widget Summary)

The home page should show a compact **Conversation Pulse** widget:

```
┌── Conversation Pulse ──────────────────┐
│ Last session: 2 days ago (34 min)       │
│ 3 decisions · 2 actions open            │
│ Mood last: 😊 Optimistic                │
│ This week: 2 sessions · 68 min total   │
│ [Start new session] [View archive]      │
└─────────────────────────────────────────┘
```

This keeps conversation top-of-mind without requiring a page visit.

### 4.5 Topic-Based Cross-Linking (The Kibana Pattern)

The most powerful integration is **clickable topic tags** that search across pages:

- Clicking "housing" on an archived session shows:
  - All sessions tagged "housing"
  - All decisions tagged "housing" (from Decisions page)
  - All tasks related to housing (from Tasks page)
  - All housing-related ideas (from Ideas page)
- This turns the 4 dashboard pages into a **queryable knowledge base** for a topic.

**Implementation note:** This requires a shared topic registry (not duplicating tags across pages). Add a `topics/registry.json` or a simple in-memory store that all pages read from.

---

## 5. Technical Notes & Guardrails

### 5.1 Local Storage Limits

The current archive uses `localStorage` with JSON serialization. As sessions accumulate, this will hit the ~5 MB limit. **Mitigations:**

- Cap archived sessions display at ~50; older ones remain in localStorage but are collapsed with a "Load more" link.
- Alternatively, add a "Delete old sessions" button with batch selection.
- Future: migrate to `IndexedDB` or a local SQLite (via Hermes service layer) if the archive becomes a core knowledge base.

### 5.2 Data Model Compatibility

New fields (mood vector, goal statement, topic tags, decision objects) should be **optional**: `buildSessionReport()` should tolerate missing keys from older archived sessions. The `parse` filter in `loadStoredSessions()` already does schema validation — extend the validation to treat new fields as optional rather than required.

### 5.3 Undo Pattern

Any action that creates or destroys data (end session, delete archive, toggle resolve) should either:
- Show a brief undo snackbar (3-second window), or
- Be soft-deletable (hide from main view, keep in a "recently deleted" folder for 7 days).

For a couple who's emotionally invested in their conversation history, accidental data loss is a trust-breaking bug.

### 5.4 Backlink Integrity

Whenever the Conversation page creates a cross-page link (session → decision, session → task), the link must be a **stable session ID** (not `session.label` or `session.id` from `Date.now()`, which could collide). Use a UUID or a hash of session content.

The referenced page must handle a broken backlink gracefully (show "Session deleted" or "Source session no longer available" instead of crashing).

---

## 6. Suggested Implementation Phasing

| Phase | Scope | Dependencies |
|---|---|---|
| **Phase 1 — Low-hanging fruit** (2–3 sessions) | Live action item input (replace hardcoded), session naming + topic tags, pre/post mood taps, export to Markdown | None |
| **Phase 2 — Decision capture** (2–3 sessions) | Decision object model, "We just decided something" button, resolution subtypes on notes, auto-push to Decisions page | Phase 1 topic tags |
| **Phase 3 — Agenda builder** (2–3 sessions) | Pre-session panel pulling from Decisions/Tasks/Idea pages, per-topic state tracking, carry-forward of undiscussed items | Phase 1–2 data model; cross-page query API |
| **Phase 4 — Aggregate & trends** (1–2 sessions) | Cross-session statistics, mood trends, speaking balance trends, dashboard home widget | Phase 1 mood data, Phase 2 decision data |
| **Phase 5 — Ambient UX** (1–2 sessions) | "Sitting beside each other" two-column layout, soft transitions, warm empty states, journal aesthetic archive | Phase 1–3 layout changes |

---

## 7. Core Principle Summary

1. **Session = goal + output, not timer + notes.** The timer is awareness; the agenda and capture are the product.
2. **Every capture type has a destination.** Questions → Ideas/Decisions. Actions → Tasks. Ideas → Idea board. Nothing stays orphaned in an archive.
3. **The archive is a queryable knowledge base.** Topic tags + cross-page links + aggregate trends turn flat history into actionable memory.
4. **Data model growth must be backward-compatible.** Old sessions survive upgrades. New fields are optional.
5. **Emotional data is structured, not just warm.** Mood vectors and per-topic sentiment create analyzable patterns, not just decoration.
6. **Cross-page integration is the force multiplier.** The conversation page becomes the dashboard's data entry point; the other pages become its reference library.

---

*This doc complements `docs/conversation-page-ideas.md`. Where Nous-girl focused on creative vision, emotional experience, and visual delight, this doc covers data flow, architectural feasibility, phased implementation, and cross-page integration surfaces. The two documents together provide the full picture for turning the conversation tracker into the dashboard's centerpiece.*
