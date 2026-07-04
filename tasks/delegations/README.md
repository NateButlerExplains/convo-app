# Delegation Queue

This directory stores M2 invocation records: one markdown file per `^profile` handoff.

## Authority

`protocols/invocation.md` is authoritative for record format, lifecycle states, concurrency, approvals, stale-work handling, and validation rules. This README is a quick reference only.

## Record Naming

- Use `deleg_NNN.md`, starting at `deleg_001.md`.
- The file name, top-level heading ID, and `ID:` field must match.
- Do not overwrite an existing delegation record.

## Lifecycle States

Allowed states:

- `proposed`: drafted but not ready to claim.
- `queued`: ready for the target profile to claim.
- `claimed`: target accepted ownership but has not started edits.
- `in_progress`: active work has started.
- `blocked`: waiting on clarification, approval, dependency, or conflict resolution.
- `review`: ready for Klerik or user review.
- `done`: reviewed/accepted and complete.
- `cancelled`: stopped intentionally; reason required.

Active states for conflict checks: `claimed`, `in_progress`, `review`.

## Creating A Record

Use `scripts/new_delegation.sh` when possible:

```bash
scripts/new_delegation.sh crow "Research invocation patterns" docs/example.md
```

For report-only handoffs, pass `none` as the touched file. This defaults to `Allowed actions: report_only`:

```bash
scripts/new_delegation.sh crow "Answer without editing files" none
```

Optional metadata flags are available when the defaults are not enough:

```bash
scripts/new_delegation.sh --review-tier Standard --allowed-actions edit_project_files,run_local_commands --approval not_required klerik "Review scripts" docs/review.md
```

Strict records must not use `--approval not_required`.

Then edit the generated file to replace `TODO:` placeholders before treating it as ready for handoff.

## Validating Records

Run:

```bash
scripts/check_delegations.sh
```

The checker fails on missing required fields and duplicate IDs. It warns on TODO placeholders, stale active records, and overlapping touched files. It never repairs records automatically.
