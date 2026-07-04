# M1 Build Plan

## 1. Recommended Local Tech Stack

Recommended stack for the first prototype:

- **Runtime:** Node.js local development server.
- **App framework:** Vite with React and TypeScript.
- **Styling:** Plain CSS modules or a single app stylesheet using CSS custom properties; no UI kit for M1.
- **Data:** Local JSON seed files imported by the app at build/dev time.
- **Exports:** Browser print styles plus downloadable JSON snapshots in M1.
- **Testing/checks:** TypeScript check, production build, and a lightweight manual responsive/accessibility checklist.

Rationale:

- Vite + React + TypeScript is fast to scaffold, easy to run on localhost, and sufficient for a polished single-user dashboard.
- JSON files keep the first data layer transparent and manually editable without database tooling.
- Plain CSS allows the warm "family move atlas" visual direction without fighting a generic component library.
- Browser print and JSON download satisfy snapshot/export needs without introducing PDF packages or server-side generation yet.

Do not add these until implementation is approved:

- Cloud database or hosted backend.
- Authentication.
- Analytics.
- External map services.
- PDF generation dependencies.
- SQLite migration.
- Package installs outside the agreed local frontend stack.

## 2. Proposed Folder Structure

Create the app under a dedicated prototype folder so the planning docs remain separate from implementation.

```text
barcelona-relocation-dashboard/
  PROJECT.md
  docs/
    m1-build-plan.md
    product-vision.md
    m1-product-structure.md
    barcelona-relocation-research.md
    visual-direction.md
    status.md
  tasks/
    kanban.md
  memory/
    facts.md
    decisions.md
  app/
    package.json
    index.html
    tsconfig.json
    vite.config.ts
    README.md
    src/
      main.tsx
      App.tsx
      styles.css
      data/
        move-map-data.json
      types/
        move-map.ts
      lib/
        selectors.ts
        formatters.ts
        snapshot.ts
      components/
        AppShell.tsx
        NavRail.tsx
        PageHeader.tsx
        StatusPill.tsx
        ConfidenceBadge.tsx
        RelatedChips.tsx
        SectionCard.tsx
        RouteLine.tsx
        ConversationCard.tsx
        DecisionPostcard.tsx
        PrintActions.tsx
      views/
        HomeView.tsx
        RoadmapView.tsx
        BudgetView.tsx
        DecisionsView.tsx
        OptionsView.tsx
        IdeasView.tsx
        TasksView.tsx
        RisksView.tsx
        DocumentsView.tsx
        SnapshotsView.tsx
```

Notes:

- `app/src/data/move-map-data.json` is the only editable data source in M1.
- `app/src/types/move-map.ts` defines the schema used by views and selectors.
- `app/src/lib/selectors.ts` holds derived data for home cards, readiness, counts, and related objects.
- `app/src/lib/snapshot.ts` builds JSON snapshot payloads for download.
- `app/README.md` should explain how to run locally, where to edit data, and how to print/export.

## 3. Data Storage Recommendation: JSON vs SQLite vs Hybrid

### Recommendation For M1: JSON Only

Use one structured JSON file for the first prototype:

```text
app/src/data/move-map-data.json
```

Why JSON is best for M1:

- Nate is the only direct updater.
- Data should be easy to inspect, copy, back up, and edit manually.
- The prototype does not need concurrent writes, user accounts, or complex queries.
- The first priority is a useful visual planning surface, not persistence engineering.
- JSON imports work directly in Vite and keep the app fully local.

### Defer SQLite

SQLite should be introduced later if:

- Editing inside the app becomes important.
- Snapshot history becomes large.
- Filtering/searching across many records becomes cumbersome.
- Data integrity constraints become hard to manage in JSON.
- Nate wants dated revisions or audit-style history.

### Avoid Hybrid For M1

A JSON + SQLite hybrid adds complexity without solving an M1 problem. It risks confusing the editing workflow and creating two sources of truth.

### M1 Data Rule

For the first prototype, the app reads JSON and renders it. The user edits JSON manually and refreshes the browser. Export creates downloaded snapshots; it does not write back to disk automatically.

## 4. Initial Data Model

Use stable IDs and lightweight relationship arrays. Keep fields explicit enough to support source confidence, family planning, and connected sections.

```ts
type ID = string;
type DateString = string; // YYYY-MM-DD when exact, YYYY-MM when month-level, or empty string.
type Confidence = "low" | "medium" | "high";
type Readiness = "open_question" | "options_listed" | "comparing" | "leaning" | "decided_for_now" | "revisit";
type WorkStatus = "not_started" | "in_progress" | "waiting" | "done" | "blocked";
type RiskStatus = "watching" | "mitigating" | "accepted" | "resolved";

type MoveMapData = {
  meta: Meta;
  plan: Plan;
  sources: Source[];
  planning_tracks: PlanningTrack[];
  roadmap_phases: RoadmapPhase[];
  milestones: Milestone[];
  budget_items: BudgetItem[];
  decisions: Decision[];
  options: Option[];
  ideas: Idea[];
  tasks: Task[];
  risks: Risk[];
  documents: DocumentItem[];
  snapshots: SnapshotRecord[];
};
```

### Meta

```ts
type Meta = {
  schema_version: string;
  data_updated_at: DateString;
  private_local_only: boolean;
  disclaimer: string;
};
```

### Plan

```ts
type Plan = {
  id: ID;
  title: string; // Barcelona Move Map
  origin: string; // Malden, Missouri
  destination: string; // Barcelona, Spain
  target_move_date: DateString; // 2027-01
  household_summary: string;
  primary_updater: string; // Nate
  collaborator_summary: string; // wife reviews during planning conversations
  last_updated: DateString;
};
```

### Source

```ts
type Source = {
  id: ID;
  title: string;
  url: string;
  publisher: string;
  topic: string;
  reliability: "official" | "professional_service" | "community" | "unknown";
  date_accessed: DateString;
  notes: string;
};
```

### Planning Track

```ts
type PlanningTrack = {
  id: ID;
  title: string;
  description: string;
  readiness: "early_research" | "taking_shape" | "ready_to_decide" | "decided_for_now";
  confidence: Confidence;
  next_action: string;
  related_decision_ids: ID[];
  related_task_ids: ID[];
  related_risk_ids: ID[];
};
```

### Roadmap Phase And Milestone

```ts
type RoadmapPhase = {
  id: ID;
  title: string;
  start_date: DateString;
  end_date: DateString;
  status: WorkStatus;
  description: string;
  milestone_ids: ID[];
};

type Milestone = {
  id: ID;
  phase_id: ID;
  title: string;
  target_date: DateString;
  status: WorkStatus;
  confidence: Confidence;
  dependency_ids: ID[];
  related_task_ids: ID[];
  related_document_ids: ID[];
  related_decision_ids: ID[];
  notes: string;
};
```

### Budget Item

```ts
type BudgetItem = {
  id: ID;
  category: string;
  label: string;
  phase: string;
  estimate_low: number | null;
  estimate_high: number | null;
  planned_amount: number | null;
  actual_amount: number | null;
  currency: "USD" | "EUR";
  frequency: "one_time" | "monthly" | "annual" | "unknown";
  confidence: Confidence;
  date_checked: DateString;
  source_ids: ID[];
  related_risk_ids: ID[];
  notes: string;
};
```

### Decision

```ts
type Decision = {
  id: ID;
  title: string;
  status: "proposed" | "leaning" | "decided" | "revisiting";
  readiness: Readiness;
  options_considered: ID[];
  rationale: string;
  decision_date: DateString;
  approvers: string[];
  revisit_date: DateString;
  related_task_ids: ID[];
  related_risk_ids: ID[];
  notes: string;
};
```

### Option

```ts
type Option = {
  id: ID;
  name: string;
  category: "visa" | "neighborhood" | "housing" | "school_childcare" | "healthcare" | "insurance" | "travel" | "financial" | "other";
  summary: string;
  pros: string[];
  cons: string[];
  estimated_cost_label: string;
  risk_level: "low" | "medium" | "high" | "unknown";
  confidence: Confidence;
  source_ids: ID[];
  related_decision_id: ID | "";
  related_budget_ids: ID[];
  related_risk_ids: ID[];
  professional_advice_required: boolean;
  notes: string;
};
```

### Idea

```ts
type Idea = {
  id: ID;
  prompt: string;
  topic: string;
  priority: "low" | "medium" | "high";
  discussed: boolean;
  outcome: string;
  related_decision_ids: ID[];
  related_option_ids: ID[];
  notes: string;
};
```

### Task

```ts
type Task = {
  id: ID;
  title: string;
  track: string;
  status: WorkStatus;
  owner: string;
  due_date: DateString;
  dependency_ids: ID[];
  related_document_ids: ID[];
  related_risk_ids: ID[];
  related_decision_id: ID | "";
  notes: string;
};
```

### Risk

```ts
type Risk = {
  id: ID;
  title: string;
  category: string;
  description: string;
  likelihood: "low" | "medium" | "high" | "unknown";
  impact: "low" | "medium" | "high" | "unknown";
  trigger: string;
  mitigation: string;
  owner: string;
  status: RiskStatus;
  professional_advice_required: boolean;
  source_ids: ID[];
  related_task_ids: ID[];
  related_document_ids: ID[];
  notes: string;
};
```

### Document Item

```ts
type DocumentItem = {
  id: ID;
  name: string;
  person: "Nate" | "Wife" | "Child" | "Household" | "Unknown";
  category: "identity" | "civil" | "financial_work" | "background_health" | "arrival_local" | "school" | "housing" | "other";
  needed_for: string;
  status: WorkStatus;
  owner: string;
  issue_date: DateString;
  expiration_date: DateString;
  due_date: DateString;
  needs_apostille: boolean;
  needs_translation: boolean;
  originals_required: boolean;
  copies_required: boolean;
  source_ids: ID[];
  related_task_ids: ID[];
  notes: string;
};
```

### Snapshot Record

```ts
type SnapshotRecord = {
  id: ID;
  title: string;
  type: "full" | "budget" | "decisions" | "roadmap" | "open_questions" | "documents";
  created_at: DateString;
  included_sections: string[];
  output_path: string;
  notes: string;
};
```

### Required Seed Data

The first data file should include enough examples to render every screen:

- 1 plan record.
- 8-10 planning tracks.
- 6-8 roadmap phases from now through arrival/stabilization.
- 10-15 milestones.
- 12-18 budget items with low/high estimates left as placeholders when unknown.
- 5-8 decisions.
- 10-14 options across visas, neighborhoods, housing, school/childcare, healthcare/insurance, and travel.
- 8-12 conversation ideas.
- 12-18 tasks.
- 8-12 risks.
- 12-18 documents.
- 3-5 sources from the relocation research.
- 1 placeholder snapshot record.

Seed data should use sourced facts from `docs/barcelona-relocation-research.md` where available and should label preliminary assumptions clearly.

## 5. First Prototype Screens

### Home

Purpose: a calm planning briefing for Nate and his wife.

Content:

- Move at a glance: Malden to Barcelona, January 2027, household summary.
- Family route line: major planning landmarks with readiness states.
- Readiness by track: visa, budget, housing, healthcare, childcare/schooling, documents, travel, arrival.
- Conversation focus: 3-5 prompts.
- Top open decisions.
- Budget range snapshot.
- Next practical steps.
- Key risks with mitigations.
- Document timing watch.
- Latest snapshot/export status.

### Roadmap

Purpose: show the route from research to arrival and stabilization.

Content:

- Quarter/month-oriented route timeline through January 2027.
- Phase cards with milestones.
- Milestone status, confidence, dependencies, and related chips.
- Clear distinction between pre-move, move month, and post-arrival stabilization.

### Budget

Purpose: make costs discussable, adjustable, and honest about uncertainty.

Content:

- One-time vs recurring budget sections.
- Low/high estimate ranges.
- Planned and actual columns when available.
- Confidence badges and date checked.
- Category summary totals by range.
- Notes and source chips.

### Decisions

Purpose: preserve what is proposed, leaning, decided, and revisiting.

Content:

- Decision postcards.
- Readiness ladder.
- Options considered.
- Rationale, approvers, decision date, revisit date.
- Related risks/tasks/options.

### Options

Purpose: compare choices before decisions.

Content:

- Filter or group by category.
- Cards for visa paths, neighborhoods, housing approaches, school/childcare, insurance, travel/logistics.
- Pros/cons, cost label, confidence, risk level.
- Professional-advice required flag.
- Related decision and budget chips.

### Ideas

Purpose: store conversation prompts and loose questions.

Content:

- Conversation cards with prompt, why it matters, topic, priority, discussed status, and outcome.
- Group by topic or priority.
- Make this view friendly and readable, not backlog-like.

### Tasks

Purpose: track practical work.

Content:

- Group tasks by planning track.
- Status, owner, due date, dependencies.
- Related document/risk/decision chips.
- Highlight next 5 upcoming tasks.

### Risks

Purpose: make uncertainty visible and actionable.

Content:

- Risk cards with likelihood, impact, trigger, mitigation, owner, and status.
- Professional-advice flags.
- Related tasks/documents.
- Avoid fear-heavy visuals; every risk needs a next action or mitigation.

### Documents

Purpose: organize paperwork and timing windows.

Content:

- Group by category and person.
- Status, owner, due date, issue/expiration dates.
- Apostille, translation, originals, copies indicators.
- Needed-for field and related tasks.

### Snapshots

Purpose: preserve and export the planning state.

Content:

- Explanation that snapshots are dated family planning artifacts.
- Buttons for: print current page, print full planning packet, download JSON snapshot.
- List of recorded placeholder snapshots from data.
- Include privacy reminder: exports remain local unless Nate shares them.

## 6. Editable Data Workflow

### M1 Workflow

1. Nate opens `app/src/data/move-map-data.json`.
2. Nate edits JSON directly using the documented schema.
3. Nate saves the file.
4. Vite hot reloads the app during development, or Nate refreshes the browser.
5. Nate uses the app for conversation and review.
6. Nate exports a JSON snapshot or prints a page/full packet when needed.

### Guardrails

- Add clear comments in `app/README.md`, not in JSON, because JSON does not support comments.
- Use predictable IDs such as `risk-visa-fit`, `doc-passport-nate`, and `decision-visa-path`.
- Keep empty unknown fields explicit: `""`, `[]`, or `null` depending on type.
- Treat source links, date checked, confidence, and professional-advice flags as first-class data.
- Do not store scans, passports, medical records, SSNs, bank account numbers, or other sensitive documents in the M1 app.
- If highly sensitive details are ever needed, require a separate privacy review first.

### Later Editing

In-app editing can be added after the read-only prototype proves the model and layout. The likely next step would be local form editing with browser download/import, then SQLite if persistent writes become necessary.

## 7. Export/Snapshot Strategy

### M1 Export Scope

Implement two local export paths:

1. **Print-friendly snapshots** using CSS print styles and `window.print()`.
2. **Downloadable JSON snapshot** generated in the browser from the current data object.

### Print Snapshot Types

The first build should support print layouts for:

- Current page.
- Full planning packet.
- Budget snapshot.
- Decisions snapshot.
- Roadmap snapshot.
- Open questions snapshot.

Implementation can start with print buttons that toggle a print mode or route to a print-friendly section before calling `window.print()`.

### JSON Snapshot Contents

A downloaded snapshot should include:

- Export timestamp.
- Schema version.
- Plan summary.
- All current data collections.
- Disclaimer that the file is a local planning snapshot and not legal/financial/medical advice.

Filename pattern:

```text
barcelona-move-map-snapshot-YYYY-MM-DD.json
```

### Deferred Export Work

Defer generated PDFs until later. Browser print-to-PDF is enough for M1 and avoids adding dependencies.

## 8. Accessibility Considerations

M1 should meet practical accessibility basics:

- Use semantic HTML landmarks: header, nav, main, section, article.
- Keep headings in logical order.
- Ensure all navigation and buttons are keyboard reachable.
- Provide visible focus states.
- Maintain sufficient color contrast for text, badges, and status labels.
- Do not rely on color alone for confidence, risk, or status.
- Use text labels with icons/patterns for statuses.
- Keep body text comfortable for shared reading on a laptop.
- Use large enough tap targets on mobile.
- Respect `prefers-reduced-motion` for any animations.
- Use `aria-current` for active navigation.
- Use descriptive button labels such as "Download JSON snapshot" rather than "Export" alone.
- Make print styles readable in grayscale.

Accessibility acceptance should be manual for M1, with browser devtools and keyboard testing. Automated a11y tooling can be added later if package installation is approved.

## 9. Mobile/Desktop Considerations

### Desktop

Desktop should be optimized for shared planning conversations.

- Left navigation rail with section labels.
- Spacious card grid.
- Home page can use a two-column layout with conversation focus on the right.
- Budget and options can use wider comparison layouts.
- Roadmap can use a horizontal family route line when space allows.
- Print styles should favor paper-like sections and avoid cutting cards awkwardly.

### Mobile

Mobile should be optimized for quick review.

- Top app bar with app name and current section.
- Horizontal section tabs or compact nav menu; bottom nav is optional but not required for M1.
- Cards stack vertically.
- Roadmap becomes a vertical route line.
- Budget table becomes grouped cards.
- Options comparison becomes category groups with card summaries.
- Snapshot buttons remain easy to reach but should not dominate small screens.

### Breakpoints

Use simple CSS breakpoints:

- `max-width: 720px`: mobile stacked cards and compact nav.
- `721px-1040px`: tablet/tight laptop two-column where useful.
- `min-width: 1041px`: desktop nav rail and wider grid.

## 10. Exact Implementation Steps For Chizul's Next Coding Pass

Do these in order after the user approves implementation.

1. Confirm any user approval choices listed in this document.
2. Create `app/` with Vite React TypeScript scaffold.
3. Add local scripts in `app/package.json`: `dev`, `build`, `preview`, and `typecheck` if not already included by scaffold.
4. Create `app/README.md` with local run instructions and manual JSON editing workflow.
5. Create `app/src/types/move-map.ts` with the M1 schema.
6. Create `app/src/data/move-map-data.json` with seed data covering every screen.
7. Create `app/src/lib/formatters.ts` for dates, currency ranges, statuses, and confidence labels.
8. Create `app/src/lib/selectors.ts` for home summary data: readiness counts, top decisions, upcoming tasks, key risks, budget ranges, document timing watch, and conversation focus.
9. Create `app/src/lib/snapshot.ts` to build a local JSON snapshot and trigger browser download.
10. Create shared components: app shell, nav rail, page header, status pill, confidence badge, related chips, route line, section card, conversation card, decision postcard, print actions.
11. Create all first prototype views: Home, Roadmap, Budget, Decisions, Options, Ideas, Tasks, Risks, Documents, Snapshots.
12. Implement client-side navigation with local React state or hash navigation; avoid adding React Router unless approved.
13. Apply the visual direction in `app/src/styles.css` using CSS variables for warm paper, Mediterranean blue, terracotta/clay, sage, sea glass, amber, coral, and ink.
14. Add responsive styles for mobile, tablet, and desktop breakpoints.
15. Add print styles for current page and full packet sections.
16. Ensure status, confidence, readiness, and risk are represented by text plus color/pattern, not color alone.
17. Add privacy/local-only language in the app footer or snapshot view.
18. Run local checks: typecheck, build, and manual run on localhost.
19. Manually verify desktop and mobile layouts using browser responsive mode.
20. Update `docs/status.md` and `tasks/kanban.md` only after implementation is complete and verified.
21. Hand off to Klerik for review using the checklist below.

## 11. Klerik Review Checklist

Klerik should review before M1 implementation is marked done.

### Local-Only And Privacy

- App runs on localhost and does not require internet after dependencies are installed.
- No cloud database, analytics, telemetry, public hosting, external API calls, or third-party map embeds.
- No sensitive document scans or private identifiers are included in seed data.
- Exported JSON remains local and has no automatic upload or share behavior.
- README warns against storing passports, SSNs, bank account numbers, medical records, or scans in M1 data.

### Data Model And Integrity

- TypeScript types match `move-map-data.json` structure.
- Every referenced ID either exists or is intentionally blank.
- Required screens have enough seed data to render meaningfully.
- Confidence, source IDs, date checked, and professional-advice flags exist where research uncertainty matters.
- Budget values show ranges or nulls instead of pretending unknown values are precise.

### Product Fit

- All required sections are present: Home, Roadmap, Budget, Decisions, Options, Ideas, Tasks, Risks, Documents, Snapshots.
- Home page supports a family planning conversation within 30 seconds.
- Family-stability topics are visible: childcare, schooling, healthcare, housing, safety, travel, arrival transition.
- Risks include mitigations or next actions.
- Decisions and options are visibly connected.
- Snapshots are framed as dated family planning artifacts.

### Accessibility And Responsiveness

- Keyboard navigation works across nav and buttons.
- Focus states are visible.
- Text contrast is acceptable.
- Status/confidence/risk is not conveyed by color alone.
- Mobile layout is readable without horizontal scrolling.
- Print layout is legible and avoids obvious broken sections.
- Reduced-motion preference is respected if animation is used.

### Build And Maintainability

- `npm run build` passes.
- TypeScript check passes if configured separately.
- Components remain small and understandable.
- No unnecessary dependencies were added.
- README accurately describes setup, run, edit, and export workflows.
- Implementation did not modify memory files.

## Choices Needing User Approval Before Coding

The next coding pass should ask Nate to confirm these choices before implementation starts:

1. **Tech stack:** Approve Vite + React + TypeScript for the local prototype.
2. **Package installation:** Approve installing local npm dependencies in `app/`.
3. **Data approach:** Approve JSON-only M1 storage with manual file editing and browser refresh.
4. **Navigation approach:** Approve simple local state/hash navigation instead of React Router for M1.
5. **Export scope:** Approve browser print-to-PDF plus JSON download instead of generated PDF packages for M1.
6. **Seed data sensitivity:** Confirm that M1 seed data should use placeholders and planning assumptions only, with no sensitive personal document numbers or private financial account details.

## Proposed Durable Decisions For Memory

Do not record these without approval:

- M1 should use JSON-only storage and manual data editing; SQLite is deferred until in-app editing or history becomes necessary.
- M1 exports should use browser print-to-PDF and local JSON snapshot download; generated PDF dependencies are deferred.
- M1 should avoid external services, analytics, cloud storage, third-party maps, and public deployment.
- The first app shell should use the family move atlas visual system with a route line, conversation cards, and decision postcards.
