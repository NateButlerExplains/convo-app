# Klerik Review 001: M1 Build Plan

## Verdict

**APPROVED WITH NOTES**

The M1 build plan is reasonable, local-first, specific enough for a first coding pass, and aligned with the product, research, and visual direction. Implementation can proceed after Nate confirms the approval choices listed in the build plan.

The main caution is scope: the plan asks for many screens, components, relationships, seed records, print behaviors, and responsive states in one pass. This is acceptable for a prototype if Chizul treats M1 as a polished read-only/static-data dashboard, not as a complete application platform.

## Review Summary

### 1. Vite + React + TypeScript Stack

Assessment: **reasonable and approved for M1**.

Why it fits:

- Vite is lightweight and appropriate for a private localhost web app.
- React supports the card-heavy, multi-view dashboard structure without requiring backend complexity.
- TypeScript is valuable because the app depends on a moderately rich JSON data model with many relationships.
- Plain CSS is the right choice for the visual direction because a component framework would likely push the app toward generic admin UI.
- The proposed stack does not require cloud services, accounts, hosted databases, or external APIs.

Notes:

- Keep dependencies minimal. Vite, React, TypeScript, and their normal local dev dependencies are enough for M1.
- Avoid adding React Router unless the user approves it. Hash navigation or local state is enough for this prototype.
- Avoid UI frameworks, charting libraries, map libraries, PDF generators, analytics, telemetry, or hosted font dependencies in M1 unless separately approved.

### 2. JSON-Only Data For M1

Assessment: **appropriate and approved for M1**.

Why it fits:

- Nate is the only direct updater.
- Manual editing is an explicit priority.
- JSON keeps the data portable, inspectable, easy to back up, and easy to version later.
- The app does not yet need concurrent edits, in-app writes, indexes, migrations, or transactional guarantees.
- JSON avoids introducing a persistence layer before the product shape is validated.

Risks:

- Manual JSON editing can break the app if the file becomes invalid.
- Relationship IDs can drift or point to missing records.
- A single large JSON file may become cumbersome after M1.

Recommended mitigations for implementation:

- Include clear `app/README.md` editing rules.
- Keep IDs predictable and human-readable.
- Add defensive rendering for missing related objects.
- Add a lightweight runtime validation helper or at least console warnings for missing IDs if this can be done without adding dependencies.
- Keep seed records concise rather than trying to exhaustively model every future planning detail.

### 3. First Prototype Scope

Assessment: **large but acceptable if treated as a read-only visual prototype**.

The plan includes ten views, many reusable components, a detailed data model, responsive layout, print styles, JSON export, and substantial seed data. That is ambitious for one coding pass.

Scope is acceptable because:

- Implementation is read-only from local JSON.
- No authentication, backend, database, cloud sync, or in-app CRUD is included.
- Export scope is limited to browser print and JSON download.
- The first prototype's purpose is visual/conversational validation, not full production workflow.

Scope warnings:

- Do not overbuild filters, sorting, charts, graphs, or complex interactive comparisons in M1.
- Do not try to make every view equally deep. Home, Roadmap, Budget, Decisions, Options, Risks, Documents, and Snapshots matter most; Tasks and Ideas can be simpler card/group views.
- Do not add full print perfection for every page in the first pass. A legible full packet and page print behavior are enough.
- Do not implement in-app editing yet.

Suggested M1 priority order if time gets tight:

1. App shell, navigation, visual system, and data loading.
2. Home view with route line, readiness, conversation focus, top decisions, key risks, budget snapshot, and document watch.
3. Roadmap, Budget, Decisions, Options, Risks, Documents.
4. Ideas, Tasks, Snapshots.
5. Print styles and JSON export.
6. Extra polish and secondary responsive refinements.

### 4. Local-Only Privacy Constraints

Assessment: **preserved**.

The plan correctly avoids:

- Cloud database.
- Hosted backend.
- Public deployment.
- Authentication complexity.
- Analytics or telemetry.
- External map embeds.
- Automatic uploads or share behavior.
- Sensitive document scans or private identifiers in seed data.

Important implementation checks:

- Do not add Google Fonts or other remote font/CDN dependencies without approval. Use local/system fallback fonts for M1 if package-free font loading is desired.
- Do not load map tiles, analytics scripts, icons, images, or CSS from external CDNs.
- Ensure all sample data is placeholder/planning-level only.
- Ensure exported JSON remains a local browser download.
- Add visible privacy language in the app footer or Snapshots view.

### 5. Export/Snapshot Strategy

Assessment: **realistic for M1**.

Browser print-to-PDF plus local JSON download is the right first export strategy.

Why it fits:

- It avoids PDF generation dependencies.
- It works locally.
- It is understandable to a non-technical reviewer.
- It satisfies the need to preserve planning state without building a snapshot archive yet.

Risks:

- Browser print output can vary by browser and printer settings.
- A true dated snapshot archive is not implemented if downloads are the only persistence mechanism.
- `window.print()` is enough for M1 but should not be described as full PDF generation.

Recommended wording/implementation:

- Label the feature as "Print / Save as PDF" rather than "Generate PDF".
- Download JSON with timestamped filename.
- Include disclaimer and schema version in the JSON snapshot.
- Keep a placeholder snapshot list in seed data, but do not imply automatic disk persistence.

### 6. Implementation Steps Specificity

Assessment: **specific enough for one coding pass**.

The steps clearly define:

- App scaffold location.
- Scripts.
- README.
- Type model.
- JSON seed file.
- Formatter, selector, and snapshot helpers.
- Shared components.
- Required views.
- Navigation approach.
- Visual CSS direction.
- Responsive and print requirements.
- Verification and Klerik handoff.

Suggestions:

- Add a pre-build data integrity check if practical, even if it only runs in development and warns about missing related IDs.
- Keep component names as proposed to reduce ambiguity.
- Use TypeScript's JSON import typing carefully; imported JSON may need explicit casting to `MoveMapData`.
- Make the README part of the implementation acceptance criteria, not an afterthought.

### 7. User Approval Needed Before Coding

Assessment: **approval list is complete and should be confirmed before implementation**.

Required approval items:

1. Vite + React + TypeScript stack.
2. Local npm package installation inside `app/`.
3. JSON-only data storage for M1.
4. Simple local/hash navigation instead of React Router.
5. Browser print-to-PDF plus JSON download instead of generated PDF dependencies.
6. Placeholder-only seed data with no sensitive personal document numbers, financial account details, medical records, scans, or private identifiers.

Additional approval suggested:

7. Confirm whether remote web fonts are disallowed for M1. Klerik recommends no remote fonts by default to preserve local-only/privacy posture.

## Risks, Blockers, Warnings, And Suggestions

### Blockers

No technical blocker found in the build plan.

Implementation should not begin until Nate approves the listed choices, especially package installation and JSON-only storage.

### Warnings

- **Scope creep risk:** Ten views plus seed data plus responsive design plus print/export can grow quickly. Keep M1 read-only and avoid advanced interactions.
- **Privacy risk:** Frontend packages are acceptable, but the app itself must not call external services or load CDN assets at runtime.
- **Data validity risk:** Manual JSON editing can break the app. Add README guidance and defensive rendering.
- **False certainty risk:** Seed data must preserve source dates, confidence, and professional-advice flags. Do not present visa, healthcare, school, tax, housing, or budget assumptions as final advice.
- **Export expectation risk:** Browser print-to-PDF is not the same as generated PDFs. Label it clearly.

### Suggestions For Chizul's Coding Pass

- Build the first pass as a static, client-only, read-only app.
- Keep data editing outside the UI for M1.
- Keep all sample data non-sensitive and preliminary.
- Use local CSS variables and avoid external assets.
- Render missing relationship chips gracefully as "not linked" or hide them rather than crashing.
- Prioritize a strong Home view because it is the main family conversation surface.
- Make the Snapshots view explicit about local-only exports and browser print behavior.
- Update `docs/status.md` and `tasks/kanban.md` only after implementation and verification, not during this review.

## Durable Decisions Proposed For Memory

Do not record without Nate's approval:

- M1 build plan is approved with notes for a read-only Vite + React + TypeScript localhost prototype.
- M1 should use JSON-only local data with manual editing and no SQLite until in-app editing, history, or larger data volume requires it.
- M1 export should use browser print/save-as-PDF plus local JSON download, not generated PDF dependencies.
- Runtime app behavior should avoid external services, telemetry, CDN assets, hosted fonts, map tiles, and public deployment by default.
