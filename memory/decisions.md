# Decisions

## 2026-07-03 — Initial Project Direction
- Build a private local-first relocation planning dashboard for moving from Malden, Missouri to Barcelona around January 2027.
- The dashboard should run on localhost and not be published online.
- The system should support roadmap planning, budget tracking, options comparison, decisions, tasks, risks, and PDF/snapshot exports.
- Nate will be the only direct updater, but the dashboard should be readable and useful for conversations with his wife.

## 2026-07-04 — M1 Prototype Shipped
- M1 is a read-only/manual-edit localhost prototype under `app/` using Vite, React, TypeScript, plain CSS, and local JSON seed data.
- M1 intentionally excludes authentication, backend services, SQLite, cloud services, analytics, telemetry, external runtime calls, remote fonts/CDNs, and in-app editing.
- M1 exports use browser print/save-as-PDF and local JSON snapshot download; generated PDF support is deferred.
- Klerik review approved M1 with notes and no blockers; the seed-data relationship note was fixed before closeout.
