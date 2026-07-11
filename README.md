# Big Trip  Barcelona Relocation Dashboard

A private, local-first relocation planning dashboard for moving from Malden, Missouri to Barcelona, Spain around January 2027. Built for Nate, his wife, and their three-year-old child to organize the move, compare options, track decisions, and plan as a family.

All data stays on your machine. No cloud, no accounts, no publishing.

## What it does

- **Dashboard**  command center with the live "Move Map" route rail (roadmap phases derived from edits on the planning pages), quick metrics, and conversation radar.
- **Conversation**  record family planning conversations, auto-transcribe with Whisper, parse into tasks/decisions/notes, and keep an archive. A prominent **Record session** button starts the flow.
- **Tasks / Decisions**  conversation-promoted tasks and decision cards, with archive and delete-all support.
- **Alon's Skills**  a kid-friendly six-month star board for our three-year-old. A **Barcelona Trip** star bank holds 180 stars that you drag (or tap **Add star**) into **Communication**, **Collaboration**, and **Listening** skills. The Listening skill shows a six-month list of accomplishments to practice before the trip.
- **Planning**  Income Planning, Housing Planning, Budget, Debt, and Expenses with a shared add/archive/delete-all pattern.
- **Reference**  Family Timeline (calendar), Options comparison, Ideas, and Risks.
- **Export**  browser print and JSON snapshot download for preserving state over time.

## Tech

- React + TypeScript
- Vite (dev server and build)
- LocalStorage + IndexedDB for state and recorded audio (no backend)
- Whisper (local `localhost:8000/transcribe`) for transcription; 9router (`localhost:20128`) for parsing

## Run it

```bash
cd app
npm install
npm run dev        # http://127.0.0.1:5173
```

Build and preview:

```bash
npm run build
npm run preview    # http://127.0.0.1:4173
```

Type-check:

```bash
npm run typecheck
```

## Navigation

| Group | Pages |
| --- | --- |
| Core | Dashboard, Conversation, Tasks, Decisions, Alon's Skills |
| Planning | Income Planning, Housing Planning, Budget, Debt, Expenses |
| Reference | Family Timeline, Options, Ideas, Risks |

## Privacy

This is a localhost-only family planning tool. Private data never leaves the machine. Do not deploy it publicly or store real identifiers (passport numbers, account numbers, medical details).

## Project layout

```
app/                 # React + Vite app
  src/views/         # page views, including AlonsSkillsView
  src/components/    # shared UI (NavRail, AppShell, recording controls)
  src/data/          # move-map-data.json seed data
docs/                # design, audit, and review notes
memory/              # durable project decisions and facts
tasks/               # kanban and delegation tracking
protocols/          # agent routing and memory conventions
```

## Notes

- Seed data is illustrative placeholder content, not current researched conclusions.
- The app is a planning prototype, not legal, immigration, tax, medical, financial, or school-placement advice.
