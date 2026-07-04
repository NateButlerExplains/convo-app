# Klerik Review 002: M1 Implementation

## Verdict

**APPROVED WITH NOTES**

The M1 implementation is complete enough for the approved read-only vertical slice and is ready for Nate to review locally. It preserves the core local-first/privacy constraints, builds successfully, includes the expected app structure after the `rm -rf app` event, and provides the requested views, seed data, print support, and JSON snapshot download.

This is not a HOLD because no blocking privacy, build, or completeness issue was found. The main notes are minor data/model polish items and maintainability cautions before future milestones.

## Blockers

None found.

## Verification Performed

- `npm run typecheck` from `app/`: passed.
- `npm run build` from `app/`: passed.
- `scripts/check_delegations.sh` from project root: passed with `0 failure(s), 0 warning(s)`.
- Expected app file structure check: 34 expected files checked, 0 missing.
- Runtime source scan in `app/src` for `http://`, `https://`, Google font/CDN strings, analytics, telemetry, `fetch(`, `XMLHttpRequest`, and `navigator.sendBeacon`: no hits.
- Seed data count check:
  - planning tracks: 8
  - roadmap phases: 6
  - milestones: 10
  - budget items: 8
  - decisions: 4
  - options: 8
  - ideas: 5
  - tasks: 8
  - risks: 7
  - documents: 9
  - sources: 5
  - snapshots: 1
- Relationship spot check found one non-blocking missing reference: `milestone-family-priorities.related_task_ids` points to `task-family-priorities`, which is not present in `tasks`.

## App Completeness Assessment

Assessment: **complete for the approved M1 vertical slice**.

Expected files are present after the earlier `rm -rf app` event:

- App scaffold: `app/package.json`, `app/index.html`, `app/tsconfig.json`, `app/vite.config.ts`, `app/README.md`.
- Core source: `app/src/main.tsx`, `app/src/App.tsx`, `app/src/styles.css`, `app/src/vite-env.d.ts`.
- Data/type layer: `app/src/data/move-map-data.json`, `app/src/types/move-map.ts`.
- Helpers: `app/src/lib/selectors.ts`, `app/src/lib/formatters.ts`, `app/src/lib/snapshot.ts`.
- Required components: `AppShell`, `NavRail`, `PageHeader`, `StatusPill`, `ConfidenceBadge`, `SectionCard`, `RouteLine`, `ConversationCard`, `DecisionPostcard`, `PrintActions`.
- Required views: `Home`, `Roadmap`, `Budget`, `Decisions`, `Options`, `Ideas`, `Tasks`, `Risks`, `Documents`, `Snapshots`.

The expected `app/` structure is intact and no expected implementation file is missing.

## Safety And Privacy Assessment

Assessment: **approved with notes**.

Positive findings:

- No authentication added.
- No backend added.
- No SQLite added.
- No cloud services added.
- No analytics or telemetry detected in source.
- No runtime external API call mechanism detected in source.
- No CDN assets, remote fonts, or external map tile usage detected in `app/src`.
- Seed data uses project facts and placeholder planning data rather than sensitive identifiers.
- README explicitly warns against storing passport numbers, SSNs, bank account numbers, medical records, scans, or private identifiers.

Notes:

- `app/src/data/move-map-data.json` contains official source URLs. That is acceptable as data/citation metadata, but the app should continue not to fetch those URLs at runtime.
- Build output was not separately scanned because source-level scan and HTML check cover the meaningful runtime intent for this M1 review. Future review can scan `app/dist` too if stricter release packaging is needed.

## Local-Only Assessment

Assessment: **approved**.

The implementation is a client-side Vite app configured for localhost/loopback development:

- `app/package.json` uses `vite --host 127.0.0.1` for dev.
- `vite.config.ts` sets both dev server and preview host to `127.0.0.1`.
- Data is imported from a local JSON file.
- No server code or backend route exists.
- No runtime network APIs were found in source.

Caution:

- `app/package.json` uses `latest` dependency ranges for Vite, React, TypeScript, and the React plugin. This is not a privacy issue, but it can reduce reproducibility across future installs. The generated `package-lock.json` helps pin the current install. For a later hardening pass, consider pinning explicit versions in `package.json`.

## Export Assessment

Assessment: **approved for M1**.

Positive findings:

- `PrintActions` exposes `Print / Save as PDF` via `window.print()`.
- `PrintActions` exposes local JSON snapshot download via `downloadJsonSnapshot`.
- `snapshot.ts` builds a local JSON blob with timestamp, schema version, plan summary, disclaimer, and full data payload.
- CSS includes `@media print` rules that hide navigation/topbar/actions/footer and simplify surfaces for printing.
- Snapshot view frames exports as local planning artifacts, not cloud sync or final PDF generation.

Notes:

- Browser print output is browser-dependent and should remain labeled as print/save-as-PDF, not generated PDF.
- M1 does not write snapshot archives back to disk automatically, which is consistent with the approved read-only/manual-export scope.

## Usability Assessment

Assessment: **approved with notes**.

Positive findings:

- Home view is the strongest section and supports a family planning conversation quickly: move summary, route line, readiness, conversation prompts, open decisions, budget ranges, tasks, risks, documents, and latest snapshot are visible.
- Roadmap, Budget, Decisions, Options, Risks, and Snapshots are functional vertical-slice views.
- Ideas, Tasks, and Documents are implemented as readable card-list views, matching the approved lightweight scope.
- The design uses warm colors, paper-like cards, route-line metaphor, conversation cards, and decision postcards rather than generic admin-table styling.
- Uncertainty is visible via confidence labels, ranges, status pills, professional-advice language, and risk mitigations.
- The app is read-only; no in-app editing controls were added.

Notes:

- The current accessibility level is reasonable for M1 but basic. It uses semantic-ish structure, `nav`, `main`, buttons, anchors, and `aria-current`. Future polish should add stronger focus styling, more explicit ARIA labeling for status-heavy content, and manual keyboard/mobile testing in browser.
- Some view files use dense one-line JSX, which passes build checks but reduces maintainability. Refactor formatting in a future cleanup if the app grows.

## Data Model And Seed Data Assessment

Assessment: **approved with one warning**.

Positive findings:

- Seed data meets the target ranges for all requested collections.
- Data avoids sensitive private identifiers.
- Official source records include reliability and date-accessed metadata.
- Visa, healthcare, school, and budget uncertainty is represented with confidence labels, placeholders, professional-advice flags, and disclaimers.
- TypeScript model aligns with JSON structure closely enough for M1.

Warning:

- One relationship points to a missing task: `task-family-priorities`. This does not currently break rendering because the app does not dereference that relationship in the affected view, but it should be corrected in a small follow-up cleanup.

Suggested fix:

- Add a `task-family-priorities` task to `app/src/data/move-map-data.json`, or remove that ID from `milestone-family-priorities.related_task_ids`.

## Warnings

- Dependency ranges use `latest`; keep `package-lock.json` committed/preserved if this becomes a repo, or pin versions later.
- There is no automated data integrity validator; missing IDs can slip into JSON. Add a local check script later if manual JSON editing continues.
- Print styling exists but has not been visually inspected in an actual browser print preview during this review.
- The app relies on browser local downloads for snapshots; no archive/history exists inside the app, by design.
- Source URLs in JSON are citations only; do not turn them into runtime fetches without privacy review.

## Suggestions

- Fix the missing `task-family-priorities` relationship before or shortly after Nate's first hands-on review.
- Add a tiny local data integrity script later to check JSON validity and relationship references.
- Pin package versions after M1 if repeatable installs become important.
- Add a manual browser test pass for keyboard focus, mobile layout, and print preview.
- Consider adding `RelatedChips` later if relationship visibility becomes more important; it was in the build plan but not required in the implementation handoff's component list.

## Durable Decisions Proposed For Memory

Do not record without Nate's approval:

- M1 implementation is approved with notes as a read-only, client-only Vite/React/TypeScript localhost prototype.
- The app should remain JSON-only and manual-edit until Nate explicitly prioritizes in-app editing or persistence history.
- Browser print/save-as-PDF and local JSON download are sufficient for M1 exports.
- Runtime behavior should continue to avoid external services, hosted assets, telemetry, analytics, map tiles, and API calls by default.
