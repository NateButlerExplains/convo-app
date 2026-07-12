# loops-factory

Run: 2026-07-12T06:23:12Z

## Inputs
- `queue.md`: missing in `/Users/nateb/.hermes/wiki`
- `agents/`: missing in `/Users/nateb/.hermes/wiki`
- Topic queues checked for context:
  - `topics/convo-app/.system/queue.md`: no `[LOOPS]` items
  - `topics/_global/.system/queue.md`: empty
- Existing loop summaries:
  - `loops/loops-factory.md`
  - `topics/convo-app/loops/loops-factory.md`

## Actions
- No `[LOOPS]` items found.
- No new agents found because root `agents/` does not exist.
- No Hermes cron jobs created.
- No kanban tasks created.

## Result
Factory idle until root `queue.md` or root `agents/` exists, or topic queue adds explicit `[LOOPS]` item.
