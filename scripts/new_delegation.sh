#!/usr/bin/env bash
set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
DELEG_DIR="$ROOT_DIR/tasks/delegations"
LOCK_DIR="$DELEG_DIR/.id_lock"

usage() {
  cat <<'USAGE'
Usage: scripts/new_delegation.sh [OPTIONS] TARGET OBJECTIVE TOUCHED_FILE [CREATOR]

Creates a queued project-local delegation record under tasks/delegations/.
This script does not spawn profiles, execute handoff bodies, edit ~/.hermes,
or contact external services.

Options:
  --review-tier TIER       Light, Standard, or Strict (default: Light)
  --allowed-actions LIST   Comma-separated allowed actions
  --approval STATE         not_required, required, granted, or waived
  -h, --help               Show this help

Defaults:
  TOUCHED_FILE=none -> Allowed actions: report_only
  otherwise         -> Allowed actions: edit_project_files

Examples:
  scripts/new_delegation.sh crow "Research invocation patterns" docs/research.md senter
  scripts/new_delegation.sh --allowed-actions report_only crow "Answer only" none
USAGE
}

is_target() {
  case "$1" in
    senter|anser|crow|chizul|klerik|kashik|nous-girl|frieza) return 0 ;;
    *) return 1 ;;
  esac
}

is_review_tier() {
  case "$1" in
    Light|Standard|Strict) return 0 ;;
    *) return 1 ;;
  esac
}

is_approval() {
  case "$1" in
    not_required|required|granted|waived) return 0 ;;
    *) return 1 ;;
  esac
}

is_action() {
  case "$1" in
    report_only|edit_project_files|run_local_commands|touch_external_systems|modify_hermes|broad_autonomy) return 0 ;;
    *) return 1 ;;
  esac
}

trim() {
  printf '%s' "$1" | sed 's/^[[:space:]]*//; s/[[:space:]]*$//'
}

validate_actions_arg() {
  value=$1
  if [ -z "$value" ]; then
    echo "ERROR: --allowed-actions requires a non-empty value" >&2
    exit 1
  fi
  old_ifs=$IFS
  IFS=,
  for action in $value; do
    action=$(trim "$action")
    if ! is_action "$action"; then
      IFS=$old_ifs
      echo "ERROR: invalid allowed action: $action" >&2
      exit 1
    fi
  done
  IFS=$old_ifs
}

cleanup_lock() {
  if [ "${LOCK_HELD:-0}" = "1" ]; then
    rmdir "$LOCK_DIR" 2>/dev/null || true
  fi
}

next_id() {
  max=0
  for path in "$DELEG_DIR"/deleg_[0-9][0-9][0-9].md; do
    [ -e "$path" ] || continue
    base=${path##*/}
    num=${base#deleg_}
    num=${num%.md}
    # Force base 10 so leading zeroes do not become octal.
    val=$((10#$num))
    if [ "$val" -gt "$max" ]; then
      max=$val
    fi
  done
  next=$((max + 1))
  if [ "$next" -gt 999 ]; then
    echo "ERROR: delegation ID range exhausted at deleg_999" >&2
    exit 1
  fi
  printf 'deleg_%03d' "$next"
}

REVIEW_TIER="Light"
ALLOWED_ACTIONS=""
APPROVAL="not_required"

while [ "$#" -gt 0 ]; do
  case "$1" in
    -h|--help)
      usage
      exit 0
      ;;
    --review-tier)
      [ "$#" -ge 2 ] || { echo "ERROR: --review-tier requires a value" >&2; exit 2; }
      REVIEW_TIER=$2
      shift 2
      ;;
    --allowed-actions)
      [ "$#" -ge 2 ] || { echo "ERROR: --allowed-actions requires a value" >&2; exit 2; }
      ALLOWED_ACTIONS=$2
      shift 2
      ;;
    --approval)
      [ "$#" -ge 2 ] || { echo "ERROR: --approval requires a value" >&2; exit 2; }
      APPROVAL=$2
      shift 2
      ;;
    --)
      shift
      break
      ;;
    --*)
      echo "ERROR: unknown option: $1" >&2
      exit 2
      ;;
    *)
      break
      ;;
  esac
done

if [ "$#" -lt 3 ] || [ "$#" -gt 4 ]; then
  usage >&2
  exit 2
fi

TARGET=$1
OBJECTIVE=$2
TOUCHED_FILE=$3
CREATOR=${4:-senter}

if ! is_target "$TARGET"; then
  echo "ERROR: unknown target profile: $TARGET" >&2
  exit 1
fi
if ! is_review_tier "$REVIEW_TIER"; then
  echo "ERROR: invalid review tier: $REVIEW_TIER" >&2
  exit 1
fi
if ! is_approval "$APPROVAL"; then
  echo "ERROR: invalid approval state: $APPROVAL" >&2
  exit 1
fi

case "$TOUCHED_FILE" in
  ""|/*|*".."*|*"project files"*)
    echo "ERROR: touched file must be an exact project-relative path or 'none'" >&2
    exit 1
    ;;
esac

if [ -z "$ALLOWED_ACTIONS" ]; then
  if [ "$TOUCHED_FILE" = "none" ]; then
    ALLOWED_ACTIONS="report_only"
  else
    ALLOWED_ACTIONS="edit_project_files"
  fi
fi
validate_actions_arg "$ALLOWED_ACTIONS"

if [ "$REVIEW_TIER" = "Strict" ] && [ "$APPROVAL" = "not_required" ]; then
  echo "ERROR: Strict delegations require --approval required, granted, or waived" >&2
  exit 1
fi

mkdir -p "$DELEG_DIR"

if ! mkdir "$LOCK_DIR" 2>/dev/null; then
  echo "ERROR: could not acquire $LOCK_DIR; another allocation may be in progress" >&2
  exit 1
fi
LOCK_HELD=1
trap cleanup_lock EXIT HUP INT TERM

ID=$(next_id)
OUT="$DELEG_DIR/$ID.md"
if [ -e "$OUT" ]; then
  echo "ERROR: refusing to overwrite existing record: $OUT" >&2
  exit 1
fi

DATE=$(date +%Y-%m-%d)
if [ "$TOUCHED_FILE" = "none" ]; then
  TOUCHED_BLOCK="Touched files: none"
else
  TOUCHED_BLOCK="Touched files:\n- $TOUCHED_FILE"
fi

cat > "$OUT" <<EOF_RECORD
# $ID - queued - ^$TARGET

ID: $ID
Status: queued
Target: $TARGET
Creator: $CREATOR
Owner: unclaimed
Review tier: $REVIEW_TIER
Allowed actions: $ALLOWED_ACTIONS
User approval: $APPROVAL
Created: $DATE
Updated: $DATE
$(printf '%b' "$TOUCHED_BLOCK")

## Handoff

^$TARGET
Objective: $OBJECTIVE
Context: TODO: Add relevant context for the receiving profile.
Inputs: TODO: Add exact files, URLs, snippets, or commands to inspect.
Expected output: TODO: Describe the output and destination.
Verification: TODO: Add a testable checklist.
Memory updates: Do not edit memory files; propose durable updates only.

## Progress Log

- $DATE - $CREATOR - Created and queued.
EOF_RECORD

printf '%s\n' "$OUT"
