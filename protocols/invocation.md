# Invocation Protocol

This protocol defines the M2 invocation mechanism: how `^profile` handoffs become concrete, trackable project-local work records. It closes the first operational version of G7 and narrows G1, G2, and G3 without implementing autonomous profile spawning.

## Scope

M2 invocation is a queue and validation layer, not an agent launcher.

This protocol does:

- Define where invocation records live.
- Define `deleg_NNN` IDs and lifecycle states.
- Define required metadata for every handoff record.
- Define claim, progress, review, done, cancellation, stale-work, and conflict rules.
- Define permission and approval fields so work cannot silently escalate.
- Define how protocol changes are proposed and reviewed.

This protocol does **not**:

- Spawn Hermes profiles automatically.
- Edit `~/.hermes`.
- Execute commands from handoff text.
- Contact external systems.
- Replace Klerik review or user approval requirements.

## Authoritative Files

- `protocols/delegation.md` remains authoritative for handoff content and routing defaults.
- `protocols/invocation.md` is authoritative for queue records, lifecycle, concurrency, permissions, and protocol-change workflow.
- `docs/conventions.md` remains authoritative for naming and file ownership conventions.
- `AGENTS.md` remains the top-level shared instruction source. If files conflict, follow `AGENTS.md` and route the conflict to Senter and Klerik.

## Storage Layout

Invocation records live under `tasks/delegations/`.

```text
tasks/
├── kanban.md
└── delegations/
    ├── README.md
    ├── deleg_001.md
    ├── deleg_002.md
    └── .id_lock/        # transient lock used only while allocating IDs
```

Rules:

- Each delegation record is one markdown file.
- File names must use `deleg_NNN.md`, where `NNN` is a zero-padded integer starting at `001`.
- The file name, top-level heading, and `ID:` field must match.
- Do not store all delegations in a single queue file.
- Do not move records between target-specific folders for status changes; update the `Status:` field instead.
- `tasks/delegations/README.md` may explain usage, but this protocol is authoritative.

## Delegation Record Template

Every invocation record must use this shape:

```markdown
# deleg_001 - queued - ^crow

ID: deleg_001
Status: queued
Target: crow
Creator: senter
Owner: unclaimed
Review tier: Light
Allowed actions: report_only
User approval: not_required
Created: 2026-07-03
Updated: 2026-07-03
Touched files:
- docs/example-output.md

## Handoff

^crow
Objective: Research the requested topic.
Context: Relevant context for the receiving profile.
Inputs: Exact files, URLs, or commands to inspect.
Expected output: Write docs/example-output.md.
Verification: 1. Output cites sources. 2. Recommendation is explicit.
Memory updates: Do not edit memory files; propose durable facts only.

## Progress Log

- 2026-07-03 - senter - Created and queued.
```

Use ASCII hyphens in new records unless the surrounding file already uses non-ASCII punctuation.

## Required Metadata

Every record must include these fields before it can move to `queued`:

- `ID:` matching `deleg_NNN`.
- `Status:` using an allowed lifecycle state.
- `Target:` one primary profile name: `senter`, `anser`, `crow`, `chizul`, `klerik`, `kashik`, `nous-girl`, or `frieza`.
- `Creator:` profile or user who created the delegation.
- `Owner:` current responsible profile, or `unclaimed`.
- `Review tier:` one of `Light`, `Standard`, or `Strict`.
- `Allowed actions:` one or more allowed action values. Use a comma-separated list on the same line, such as `report_only` or `edit_project_files, run_local_commands`.
- `User approval:` one approval state.
- `Created:` ISO date (`YYYY-MM-DD`) or timestamp.
- `Updated:` ISO date (`YYYY-MM-DD`) or timestamp.
- `Touched files:` exact project-relative paths expected to be edited or created, one path per list item. Use the literal single-line value `Touched files: none` only for report-only work that does not edit files.

The `## Handoff` section must include the required fields from `protocols/delegation.md`:

- `Objective:`
- `Inputs:`
- `Expected output:`

`Context:`, `Verification:`, and `Memory updates:` are strongly recommended. `Verification:` is required for Standard and Strict records.

## Lifecycle States

Allowed states:

- `proposed`: drafted but not ready to claim.
- `queued`: ready for the target profile to claim.
- `claimed`: target accepted ownership but has not started edits.
- `in_progress`: active work has started.
- `blocked`: cannot proceed without clarification, approval, dependency, or conflict resolution.
- `review`: output is ready for Klerik or user review.
- `done`: reviewed/accepted and complete.
- `cancelled`: intentionally stopped; reason required in `Progress Log`.

Active states for conflict detection:

- `claimed`
- `in_progress`
- `review`

Terminal states:

- `done`
- `cancelled`

## Status Transition Rules

Valid default transitions:

```text
proposed -> queued
queued -> claimed
claimed -> in_progress
in_progress -> blocked
blocked -> in_progress
in_progress -> review
review -> in_progress
review -> done
proposed -> cancelled
queued -> cancelled
claimed -> cancelled
in_progress -> cancelled
blocked -> cancelled
review -> cancelled
```

Rules:

- Only the target profile may claim a `queued` record unless Senter or the user reassigns it.
- Claiming sets `Owner:` to the claiming profile and adds a progress log entry.
- Moving to `in_progress` requires `Touched files:` to be explicit and conflict-checked.
- Moving to `review` requires the expected output to exist or the record to explain why review is requested without file output.
- Moving Standard or Strict work to `done` requires Klerik approval unless the user explicitly waived review where waiver is allowed.
- Moving to `cancelled` requires a reason in `Progress Log`.
- Do not skip directly from `queued` to `done` except for trivial Light records where the work was completed inline and the log explains it.

## Roles and Authority

### Senter

Senter coordinates active work:

- Assigns or approves delegation IDs when manually creating records.
- Resolves conflicting `Touched files` claims.
- Cancels or reassigns stale active records.
- Updates `tasks/kanban.md` when milestone-level state changes.

### Target Profile

The target profile:

- Claims records addressed to itself.
- Updates `Status:`, `Owner:`, `Updated:`, and `Progress Log` for its own work.
- May only perform actions allowed by `Allowed actions:` and the review tier.
- Must not exceed the handoff scope without creating or requesting a new delegation record.

### Klerik

Klerik is the review gate:

- Reviews Standard and Strict records before they are marked `done`.
- Reports blockers, warnings, and suggestions.
- Can block completion by reporting blockers.
- Does not silently waive review; only the user can waive required review where waiver is allowed.

### Kashik

Kashik consolidates after major work:

- Updates `docs/status.md` and `tasks/kanban.md` after reviewed milestones.
- Proposes durable memory updates.
- Does not edit memory files unless explicitly instructed or already authorized by the user.

## Allowed Actions

Use one or more of these values in `Allowed actions:`:

- `report_only`: may inspect inputs and write a response, but may not edit files.
- `edit_project_files`: may create or edit project-local files named in `Touched files:`.
- `run_local_commands`: may run local read/test/build commands relevant to the record.
- `touch_external_systems`: may interact with systems outside the project or local workspace.
- `modify_hermes`: may modify `~/.hermes`, profiles, skills, plugins, cron, gateway, or Hermes config.
- `broad_autonomy`: may grant or exercise broad agent autonomy, including autonomous spawning, recurring jobs, or delegation loops.

Rules:

- `report_only` is the default for Crow and Anser unless the record explicitly permits file edits.
- `edit_project_files` must name exact `Touched files`.
- `run_local_commands` must be justified by verification needs.
- `touch_external_systems`, `modify_hermes`, and `broad_autonomy` are Strict-tier by default.
- M2 scripts must never execute commands from delegation records. They may only create, validate, list, and summarize records.

## Review Tier and Approval Rules

Use the review tiers from `protocols/delegation.md`.

### Light

Typical for docs, notes, research, and task-board updates.

- Klerik review is not required by default.
- Self-check against `docs/conventions.md` is required.
- User approval can complete the work.

### Standard

Typical for code, config, scripts, protocol edits, profile instructions, and new tools or commands.

- Klerik review is required before `done`.
- `Verification:` is required.
- The record must include exact touched files and test/inspection steps.

### Strict

Typical for `~/.hermes`, credentials, deployment, external systems, destructive commands, gateway configuration, cron, or broad autonomy.

- User approval is required before work starts.
- Klerik review is required before and after changes.
- `User approval:` must be `granted` before moving to `in_progress`.
- Approval evidence must be recorded in `Progress Log` or an `Approval notes:` field.

Allowed `User approval:` values:

- `not_required`
- `required`
- `granted`
- `waived`

`waived` may only be used when the user explicitly waives a review/approval requirement allowed by project policy. Record the waiver source in `Progress Log`.

## Concurrency Rules

Concurrency is allowed only when file ownership is clear.

Rules:

- Every active record must declare exact `Touched files` before edits begin.
- Two active records must not edit the same file unless Senter explicitly approves and serializes the work.
- High-conflict files require Senter coordination before edits:
  - `tasks/kanban.md`
  - `docs/status.md`
  - `memory/decisions.md`
  - `memory/facts.md`
  - `protocols/*`
  - `AGENTS.md`
  - `PROJECT.md`
- If a conflict is discovered after work starts, move one or both records to `blocked` and ask Senter or the user to resolve ordering.
- Conflict resolution must preserve both agents' work. Do not delete or overwrite another profile's changes without explicit user direction.

## Stale Work Rules

A record is stale when it is in `claimed` or `in_progress` and `Updated:` is older than 24 hours, unless the progress log explicitly states a longer expected delay.

Rules:

- Stale records produce warnings, not automatic cancellation.
- Senter or the user may reassign, unblock, cancel, or extend stale work.
- Reassignment must update `Owner:`, `Updated:`, and `Progress Log`.
- Cancelled stale work must preserve the record with `Status: cancelled`; do not delete it.

## ID Allocation Rules

Manual allocation:

- Senter may assign the next visible `deleg_NNN` ID.
- Before creating a record, inspect `tasks/delegations/` for existing IDs.
- Never overwrite an existing `deleg_NNN.md` file.

Scripted allocation:

- Use an atomic local lock directory: `mkdir tasks/delegations/.id_lock`.
- If lock creation fails, stop and report that another allocation is in progress.
- Remove `.id_lock/` after allocation completes.
- If a stale `.id_lock/` exists, Senter or the user must inspect and remove it manually.
- Do not rely on bash 4 features such as associative arrays or `mapfile`.

## Validation Requirements

A future `scripts/check_delegations.sh` must validate:

- File name matches `deleg_NNN.md`.
- Header and `ID:` match the file name.
- Required metadata fields exist.
- `Status:` uses an allowed lifecycle state.
- `Target:` is a known primary profile.
- `Review tier:` is valid.
- `Allowed actions:` values are valid.
- `User approval:` value is valid.
- `Touched files:` is exact or `none`.
- `Objective:`, `Inputs:`, and `Expected output:` exist in `## Handoff`.
- Standard and Strict records include `Verification:`.
- Duplicate IDs do not exist.
- Active records do not have overlapping `Touched files` unless conflict approval is recorded.
- Stale active records are reported.
- Strict records cannot be `in_progress` without `User approval: granted` or a recorded explicit waiver.

Validation should fail on missing required fields and duplicate IDs. It should warn on stale records and potential conflicts unless the conflict is explicitly approved.

## Protocol Change Process

Protocol changes are Standard-tier by default. Changes that grant broad autonomy, modify `~/.hermes`, change review requirements, or authorize external systems are Strict-tier.

Process:

1. Create or update a `deleg_NNN` record describing the protocol change.
2. Include objective, rationale, files affected, expected output, verification, and rollback plan.
3. Senter routes the proposal.
4. Anser may draft the design.
5. Chizul may implement project-local file changes.
6. Klerik reviews protocol changes before they are marked `done`.
7. User approval is required for material policy changes, Strict-tier changes, or any change that expands autonomy.
8. Kashik consolidates the outcome after approval.

Conflict rule:

- If protocol files conflict, follow `AGENTS.md` as top-level instruction and route the conflict to Senter and Klerik.
- Do not use a conflicting protocol interpretation to justify broader authority.

## Implementation Constraints for Chizul

Chizul must keep M2 implementation conservative:

- Project-local files only.
- No `~/.hermes` edits.
- No autonomous profile spawning.
- No daemon, watcher, cron, API gateway, or external service.
- No command execution from handoff bodies.
- Bash 3.2 compatible scripts only.
- Exact path handling; no vague `project files` values for touched files.
- Refuse to overwrite existing delegation records.
- Prefer validation and explicit warnings over automatic destructive repair.

## M2 Completion Bar

M2 invocation is complete when:

- `protocols/invocation.md` exists and is reviewed.
- `tasks/delegations/` has a documented record format.
- A sample delegation can be created and validated.
- Required fields, lifecycle states, allowed actions, user approval, and review tiers are enforced by documented rules and/or validation tooling.
- Active touched-file conflicts are detectable.
- The project remains honest that this is queue-based invocation, not automatic profile spawning.
