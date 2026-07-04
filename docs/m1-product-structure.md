# M1 Product Structure

## 1. Product Name Recommendation

Recommended name: **Barcelona Move Map**.

Rationale:
- "Move Map" is plain enough for family planning conversations.
- It suggests both a roadmap and a visual command center without sounding corporate.
- It can comfortably hold practical planning modules like budget, documents, risks, and tasks.

Alternate names:
- Barcelona Relocation Command Center: clear, but a little formal.
- Barcelona Family Landing Plan: warm, but less direct for task and budget tracking.
- Malden to Barcelona Planner: concrete, but less flexible if plans evolve.

## 2. Target Users

### Primary updater: Nate
- Adds and edits planning data.
- Keeps tasks, documents, budget estimates, and decisions current.
- Uses the app as the operational source of truth for family relocation planning.

### Collaborator/viewer: Nate's wife
- Reviews the plan during family conversations.
- Helps evaluate options, risks, budget tradeoffs, and decision readiness.
- Needs a clear, welcoming interface that does not feel like a technical admin tool.

### Family context
- Household includes Nate, his wife, and a three-year-old child.
- The app must make family-stability concerns visible: childcare, schooling, healthcare, neighborhood safety, travel logistics, timing, and contingency planning.

## 3. Main Dashboard Sections

### Home Overview
Purpose: one calm landing page showing where the move plan stands.

Core elements:
- Move target summary: Malden, Missouri to Barcelona, Spain around January 2027.
- Countdown or time horizon to January 2027.
- Readiness snapshot by planning track.
- Top open decisions.
- Near-term tasks.
- Highest risks.
- Latest snapshot/export date.

### Roadmap
Purpose: show the move timeline from now through arrival and stabilization.

Should track:
- Phases such as research, feasibility, financial planning, visa preparation, housing exploration, healthcare/childcare planning, document preparation, travel logistics, final move preparation, arrival, and stabilization.
- Milestones with target dates, status, dependencies, and notes.
- Quarter-by-quarter planning from now to January 2027.

### Budget
Purpose: make relocation costs discussable and adjustable.

Should track:
- Estimated, planned, and actual costs.
- Categories such as visa/legal, flights, housing deposits, temporary lodging, monthly living expenses, healthcare/insurance, childcare/schooling, shipping/storage, emergency fund, local transportation, language/cultural prep, and miscellaneous.
- Confidence level and notes for each estimate.

### Decisions
Purpose: preserve what was decided, why, and what needs revisiting.

Should track:
- Decision title.
- Status: proposed, leaning, decided, revisiting.
- Options considered.
- Rationale.
- Date.
- Who needs to agree.
- Revisit date.

### Options
Purpose: compare possible choices before deciding.

Should track:
- Neighborhoods, visa paths, housing approaches, schools/childcare options, insurance options, travel approaches, and financial strategies.
- Pros, cons, estimated cost, risk, confidence, notes, and related decision.

### Ideas
Purpose: capture discussion prompts and loose thoughts without forcing immediate structure.

Should track:
- Idea or question.
- Topic.
- Priority.
- Notes.
- Discussed status.
- Outcome.

### Tasks
Purpose: manage practical work required before the move.

Should track:
- Task title.
- Planning track.
- Status.
- Owner.
- Due date or target month.
- Dependencies.
- Related document, risk, or decision.

### Risks
Purpose: make uncertainty visible instead of hidden.

Should track:
- Risk title.
- Category.
- Likelihood.
- Impact.
- Mitigation.
- Trigger or warning sign.
- Owner.
- Status.

### Documents
Purpose: track paperwork needed for relocation planning.

Should track:
- Document name.
- Category.
- Needed for.
- Status.
- Owner.
- Due date.
- Renewal/expiration date if relevant.
- Notes.

### Exports / Snapshots
Purpose: preserve planning state over time and create family discussion artifacts.

Should support:
- Full planning snapshot.
- Budget snapshot.
- Decisions snapshot.
- Roadmap snapshot.
- Open questions snapshot.
- JSON data export.
- Later PDF exports.

## 4. MVP Scope

The first prototype should be a private localhost web app with static seed data and simple local editing deferred unless implementation cost is low.

MVP must include:
- A home overview that summarizes the move, readiness, next tasks, open decisions, key risks, and snapshot status.
- A roadmap view with phases and milestones through January 2027.
- A budget view with editable-looking categories, estimate ranges, confidence, and notes even if persistence is not complete yet.
- A decisions view with statuses and rationale fields.
- An options comparison view for visas, neighborhoods, housing, schooling/childcare, insurance, and travel/logistics.
- An ideas view for conversation prompts and open questions.
- A tasks/checklist view grouped by planning track.
- A risks view with likelihood, impact, and mitigation.
- A documents view with status and deadlines.
- An exports/snapshots view that explains available snapshot types and includes at least JSON export or printable browser output in the first build.
- Local-first architecture with no public deployment and no required cloud services.
- A warm, family-friendly visual design that works on desktop and mobile.

MVP should not include:
- User accounts.
- Cloud sync.
- Public hosting.
- Automated legal, visa, financial, or medical advice.
- Complex permissions.
- Multi-user real-time editing.
- External integrations unless explicitly approved.

## 5. Later Features

Later features can include:
- Full create/edit/delete forms for every planning object.
- SQLite persistence if JSON becomes too limited.
- PDF generation for snapshots.
- Snapshot archive with dated versions.
- Import/export tools for backing up local data.
- Research citation links attached to budget, visa, school, healthcare, and neighborhood entries.
- Timeline dependency visualization.
- Readiness scoring by planning track.
- Scenario planning for different visa, income, housing, or timing assumptions.
- Neighborhood comparison map or offline map notes.
- Print-friendly family discussion packets.
- Calendar export for milestones and deadlines.
- Document expiration reminders that run locally only.

## 6. Suggested Data Model At A High Level

Prefer a simple portable data layer first. A single JSON file or a small set of JSON files is enough for M1/MVP. SQLite can be introduced later if editing, filtering, and history become more complex.

Suggested top-level collections:

```text
plan
- id
- title
- origin
- destination
- target_move_date
- household_summary
- last_updated

roadmap_phases
- id
- title
- start_date
- end_date
- status
- description
- milestone_ids

milestones
- id
- phase_id
- title
- target_date
- status
- dependency_ids
- related_task_ids
- notes

budget_items
- id
- category
- label
- estimate_low
- estimate_high
- planned_amount
- actual_amount
- currency
- confidence
- notes

choices_or_decisions
- id
- title
- status
- options_considered
- rationale
- decision_date
- approvers
- revisit_date
- notes

options
- id
- name
- category
- pros
- cons
- estimated_cost
- risk_level
- confidence
- related_decision_id
- notes

ideas
- id
- prompt
- topic
- priority
- discussed
- outcome
- notes

tasks
- id
- title
- track
- status
- owner
- due_date
- dependency_ids
- related_document_ids
- related_risk_ids
- related_decision_id
- notes

risks
- id
- title
- category
- likelihood
- impact
- mitigation
- trigger
- owner
- status
- notes

documents
- id
- name
- category
- needed_for
- status
- owner
- due_date
- expiration_date
- notes

snapshots
- id
- title
- type
- created_at
- included_sections
- output_path
- notes
```

Recommended statuses:
- Roadmap/milestone/task/document: not_started, in_progress, waiting, done, blocked.
- Decision: proposed, leaning, decided, revisiting.
- Risk: watching, mitigating, accepted, resolved.
- Confidence: low, medium, high.

## 7. First Prototype Acceptance Criteria

The first prototype is acceptable when:

1. It runs locally on localhost with clear setup instructions.
2. It does not require a cloud account, hosted database, analytics service, or public deployment.
3. It visually includes all nine required sections: roadmap, budget, decisions, options, ideas, tasks, risks, documents, and exports/snapshots.
4. The home overview gives Nate and his wife a useful planning conversation starting point within 30 seconds.
5. The roadmap clearly points toward January 2027 and includes phases before, during, and after the move.
6. The budget view separates estimates from actuals and shows confidence or uncertainty.
7. Decisions and options are visibly connected: options help evaluate choices, decisions preserve outcomes.
8. Risks and documents are first-class sections, not buried in notes.
9. The app is usable on a laptop and readable on a phone.
10. Seed data reflects the real family context without pretending to be final legal, financial, or immigration advice.
11. Export/snapshot capability exists at least as print-friendly output or JSON export in the first prototype.
12. Klerik has reviewed code/config/scripts before the implementation task is marked done, unless the user explicitly waives review where allowed.
13. `tasks/kanban.md` and `docs/status.md` are updated after implementation and review.

## 8. Exact Follow-Up Handoffs

### Crow Handoff

```text
^crow
Objective: Research first-pass relocation planning inputs for the Barcelona Move Map seed data.
Context: The app is a private localhost planning dashboard for Nate and his wife as they consider moving from Malden, Missouri to Barcelona around January 2027 with a three-year-old child. Research should support planning conversations, not final legal, financial, medical, or immigration advice.
Inputs: Read AGENTS.md, PROJECT.md, docs/product-vision.md, docs/status.md, docs/m1-product-structure.md, memory/facts.md.
Expected output: Write docs/m1-research-brief.md with concise, sourced notes for visa/residency paths, budget categories, healthcare, childcare/schooling, neighborhoods, documents, risks, and open questions. Include source links and a short "requires professional advice" section.
Verification: 1. Covers each required planning track. 2. Separates sourced facts from assumptions. 3. Includes source links. 4. Flags legal/immigration/financial/medical uncertainty. 5. Does not modify app code.
Memory updates: Do not edit memory files. Propose durable facts only.
```

### Nous-girl Handoff

```text
^nous-girl
Objective: Define the visual and interaction direction for the Barcelona Move Map first prototype.
Context: The app should feel warm, calm, practical, and conversation-friendly for Nate and his wife. It should avoid generic admin-dashboard styling while preserving clarity for family planning.
Inputs: Read AGENTS.md, PROJECT.md, docs/product-vision.md, docs/status.md, docs/m1-product-structure.md.
Expected output: Write docs/m1-design-direction.md with visual concept, tone, color direction, typography direction, layout guidance, mobile behavior, and 2-3 distinctive UI patterns for roadmap, uncertainty, and family discussion prompts.
Verification: 1. Covers all required dashboard sections. 2. Clearly supports desktop and mobile. 3. Keeps the interface family-friendly and non-corporate. 4. Does not start implementation.
Memory updates: Do not edit memory files. Propose durable design conventions only.
```

### Chizul Handoff

```text
^chizul
Objective: Build the first private localhost prototype of Barcelona Move Map after product, research, and design inputs are available.
Context: Implementation should not start until docs/m1-product-structure.md, docs/m1-research-brief.md, and docs/m1-design-direction.md exist or the user explicitly approves starting without them. The app must be local-first and private.
Inputs: Read AGENTS.md, PROJECT.md, docs/product-vision.md, docs/status.md, docs/m1-product-structure.md, docs/m1-research-brief.md, docs/m1-design-direction.md, tasks/kanban.md.
Expected output: Create the local web app files and seed data needed to run the prototype on localhost. Include setup/run instructions. Update docs/status.md and tasks/kanban.md after implementation.
Verification: 1. App runs locally on localhost. 2. No cloud services or public deployment are required. 3. All nine required sections are visible. 4. Desktop and mobile layouts are usable. 5. Export/snapshot support exists at least as print-friendly output or JSON export. 6. Local build/check command passes if a build system is added.
Memory updates: Do not edit memory files unless explicitly approved. Propose durable implementation decisions.
```

### Klerik Handoff

```text
^klerik
Objective: Review the first Barcelona Move Map implementation for correctness, privacy, local-only behavior, usability, and maintainability.
Context: Klerik review is mandatory before code/config/scripts are marked done. The app is private family planning software and should not expose private data externally.
Inputs: Read AGENTS.md, PROJECT.md, docs/status.md, docs/m1-product-structure.md, tasks/kanban.md, and all files created or modified by Chizul.
Expected output: Report blockers first, then warnings, then suggestions. State whether the implementation can move to done or must return to Chizul.
Verification: 1. Confirms app runs locally. 2. Confirms no unapproved cloud/network dependency. 3. Checks all nine required sections. 4. Checks export/snapshot behavior. 5. Checks setup instructions. 6. Notes missing tests or validation.
Memory updates: Do not edit memory files. Propose durable review standards if needed.
```

### Kashik Handoff

```text
^kashik
Objective: Consolidate project memory after M1 product structure, research, design, implementation, and review are complete.
Context: The project uses markdown files as shared memory. Durable decisions should be short and not duplicate task state.
Inputs: Read AGENTS.md, PROJECT.md, docs/status.md, docs/m1-product-structure.md, docs/m1-research-brief.md, docs/m1-design-direction.md, tasks/kanban.md, memory/decisions.md, memory/facts.md, and Klerik's review output.
Expected output: Update docs/status.md with a concise M1 handoff summary. Propose or apply approved durable updates to memory/decisions.md and memory/facts.md. Keep task state in tasks/kanban.md.
Verification: 1. Removes or archives stale status notes if needed. 2. Does not duplicate facts across memory files. 3. Captures only durable decisions/facts. 4. Leaves a clear next-step summary.
Memory updates: Update project memory only after implementation and review outcomes are known or explicitly approved.
```

## Proposed Durable Decisions

Do not record these until Nate approves them:

1. Name the product **Barcelona Move Map** for the first prototype.
2. Use JSON as the initial local data format for M1/MVP, with SQLite deferred until editing/history needs become more complex.
3. Treat exports/snapshots as an MVP requirement, satisfied initially by print-friendly output or JSON export, with PDF generation deferred unless easy.
4. Require product structure, research brief, and design direction before Chizul starts implementation unless the user explicitly approves skipping one.
