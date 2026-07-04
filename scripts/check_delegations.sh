#!/usr/bin/env bash
set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
DELEG_DIR="$ROOT_DIR/tasks/delegations"
NOW_EPOCH=$(date +%s)
STALE_SECONDS=86400
FAILS=0
WARNS=0
SEEN_IDS=""
TEMP_FILES=""

fail() {
  echo "FAIL: $1"
  FAILS=$((FAILS + 1))
}

warn() {
  echo "WARN: $1"
  WARNS=$((WARNS + 1))
}

info() {
  echo "INFO: $1"
}

safe_remove_temp_file() {
  tmp=$1
  case "${tmp:-}" in
    ""|"/"|"$HOME") return 1 ;;
    *deleg_touched.*|*deleg_active.*) rm -f "$tmp" ;;
    *) return 1 ;;
  esac
}

cleanup() {
  for tmp in $TEMP_FILES; do
    safe_remove_temp_file "$tmp" || true
  done
}
trap cleanup EXIT HUP INT TERM

make_temp_file() {
  tmp=$(mktemp "${TMPDIR:-/tmp}/$1.XXXXXX")
  TEMP_FILES="$TEMP_FILES $tmp"
  echo "$tmp"
}

field_value() {
  # Prints the value after the first colon on the first matching field line.
  # Field names are fixed by protocols/invocation.md.
  file=$1
  field=$2
  grep -m 1 "^$field:" "$file" 2>/dev/null | sed 's/^[^:]*:[[:space:]]*//'
}

has_line() {
  file=$1
  pattern=$2
  grep -q "$pattern" "$file" 2>/dev/null
}

is_status() {
  case "$1" in
    proposed|queued|claimed|in_progress|blocked|review|done|cancelled) return 0 ;;
    *) return 1 ;;
  esac
}

is_active_status() {
  case "$1" in
    claimed|in_progress|review) return 0 ;;
    *) return 1 ;;
  esac
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

validate_actions() {
  file=$1
  value=$2
  if [ -z "$value" ]; then
    fail "$file: missing Allowed actions value"
    return
  fi
  old_ifs=$IFS
  IFS=,
  for action in $value; do
    action=$(trim "$action")
    if ! is_action "$action"; then
      fail "$file: invalid Allowed actions value: $action"
    fi
  done
  IFS=$old_ifs
}

validate_date() {
  file=$1
  field=$2
  value=$3
  if [ -z "$value" ]; then
    fail "$file: missing $field value"
    return
  fi
  case "$value" in
    [0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]*) return ;;
    *) fail "$file: $field must start with YYYY-MM-DD: $value" ;;
  esac
}

date_epoch() {
  value=$1
  if epoch=$(date -j -f '%Y-%m-%d' "$value" +%s 2>/dev/null); then
    echo "$epoch"
  elif epoch=$(date -d "$value" +%s 2>/dev/null); then
    echo "$epoch"
  else
    echo ""
  fi
}

touched_files() {
  file=$1
  value=$(field_value "$file" "Touched files")
  if [ "$value" = "none" ]; then
    return 0
  fi
  awk '
    /^Touched files:[[:space:]]*$/ { in_list=1; next }
    in_list && /^- / { sub(/^- /, ""); print; next }
    in_list && NF == 0 { next }
    in_list { exit }
  ' "$file"
}

validate_touched_files() {
  file=$1
  status=$2
  value=$(field_value "$file" "Touched files")
  if [ "$value" = "none" ]; then
    return 0
  fi
  if [ -n "$value" ]; then
    fail "$file: Touched files must be 'none' or a list under 'Touched files:'"
    return
  fi

  touch_tmp=$(make_temp_file deleg_touched)
  touched_files "$file" | while IFS= read -r touched; do
    case "$touched" in
      ""|/*|*".."*|*"project files"*) echo "BAD:$touched" ;;
      *) echo "OK:$touched" ;;
    esac
  done > "$touch_tmp"

  if [ ! -s "$touch_tmp" ]; then
    fail "$file: missing Touched files list entries"
  else
    while IFS= read -r result; do
      case "$result" in
        BAD:*) fail "$file: invalid touched file path: ${result#BAD:}" ;;
      esac
    done < "$touch_tmp"
  fi
  safe_remove_temp_file "$touch_tmp" || true

  if is_active_status "$status"; then
    touched_files "$file" | while IFS= read -r touched; do
      [ -n "$touched" ] || continue
      printf '%s|%s\n' "$touched" "$file" >> "$ACTIVE_TMP"
    done
  fi
}

check_required_handoff_field() {
  file=$1
  field=$2
  if ! has_line "$file" "^$field:[[:space:]]*[^[:space:]]"; then
    fail "$file: missing or empty handoff field: $field"
  fi
}

check_todo_field() {
  file=$1
  field=$2
  value=$(field_value "$file" "$field")
  case "$value" in
    TODO:*|TODO) warn "$file: placeholder TODO remains in handoff field: $field" ;;
  esac
}

validate_file() {
  file=$1
  base=${file##*/}
  id=${base%.md}

  case "$base" in
    deleg_[0-9][0-9][0-9].md) ;;
    *) fail "$file: filename must match deleg_NNN.md" ;;
  esac

  header=$(sed -n '1p' "$file")
  case "$header" in
    "# $id - "*) ;;
    *) fail "$file: heading must start with '# $id - '" ;;
  esac

  record_id=$(field_value "$file" "ID")
  status=$(field_value "$file" "Status")
  target=$(field_value "$file" "Target")
  creator=$(field_value "$file" "Creator")
  owner=$(field_value "$file" "Owner")
  tier=$(field_value "$file" "Review tier")
  actions=$(field_value "$file" "Allowed actions")
  approval=$(field_value "$file" "User approval")
  created=$(field_value "$file" "Created")
  updated=$(field_value "$file" "Updated")

  [ "$record_id" = "$id" ] || fail "$file: ID field must match filename ($id)"
  [ -n "$creator" ] || fail "$file: missing Creator value"
  [ -n "$owner" ] || fail "$file: missing Owner value"

  if ! is_status "$status"; then
    fail "$file: invalid Status: $status"
  fi
  if ! is_target "$target"; then
    fail "$file: invalid Target: $target"
  fi
  if ! is_review_tier "$tier"; then
    fail "$file: invalid Review tier: $tier"
  fi
  validate_actions "$file" "$actions"
  if ! is_approval "$approval"; then
    fail "$file: invalid User approval: $approval"
  fi
  validate_date "$file" "Created" "$created"
  validate_date "$file" "Updated" "$updated"
  validate_touched_files "$file" "$status"

  case " $SEEN_IDS " in
    *" $id "*) fail "$file: duplicate ID: $id" ;;
    *) SEEN_IDS="$SEEN_IDS $id" ;;
  esac

  if ! has_line "$file" '^## Handoff$'; then
    fail "$file: missing ## Handoff section"
  fi
  check_required_handoff_field "$file" "Objective"
  check_required_handoff_field "$file" "Inputs"
  check_required_handoff_field "$file" "Expected output"
  check_required_handoff_field "$file" "Verification"
  check_required_handoff_field "$file" "Memory updates"
  check_todo_field "$file" "Objective"
  check_todo_field "$file" "Context"
  check_todo_field "$file" "Inputs"
  check_todo_field "$file" "Expected output"
  check_todo_field "$file" "Verification"
  check_todo_field "$file" "Memory updates"

  if { [ "$tier" = "Standard" ] || [ "$tier" = "Strict" ]; } && ! has_line "$file" '^Verification:[[:space:]]*[^[:space:]]'; then
    fail "$file: Standard/Strict records require Verification"
  fi

  if [ "$tier" = "Strict" ] && [ "$status" = "in_progress" ]; then
    if [ "$approval" != "granted" ] && [ "$approval" != "waived" ]; then
      fail "$file: Strict in_progress records require User approval granted or waived"
    fi
  fi

  if { [ "$status" = "claimed" ] || [ "$status" = "in_progress" ]; } && [ -n "$updated" ]; then
    updated_date=${updated%%[ T]*}
    updated_epoch=$(date_epoch "$updated_date")
    if [ -n "$updated_epoch" ]; then
      age=$((NOW_EPOCH - updated_epoch))
      if [ "$age" -gt "$STALE_SECONDS" ]; then
        warn "$file: stale $status record; Updated is older than 24 hours"
      fi
    else
      warn "$file: could not parse Updated date for stale check: $updated"
    fi
  fi
}

check_conflicts() {
  [ -s "$ACTIVE_TMP" ] || return 0
  sort "$ACTIVE_TMP" | awk -F '|' '
    $1 == prev_path && $2 != prev_file {
      if (!reported[$1]) {
        print "WARN: touched-file conflict: " $1 " appears in multiple active records"
        reported[$1]=1
      }
    }
    { prev_path=$1; prev_file=$2 }
  '
}

if [ ! -d "$DELEG_DIR" ]; then
  info "no delegation directory: $DELEG_DIR"
  exit 0
fi

ACTIVE_TMP=$(make_temp_file deleg_active)

found=0
for file in "$DELEG_DIR"/deleg_[0-9][0-9][0-9].md; do
  [ -e "$file" ] || continue
  found=1
  validate_file "$file"
done

if [ "$found" -eq 0 ]; then
  info "no delegation records found"
fi

conflict_output=$(check_conflicts)
if [ -n "$conflict_output" ]; then
  echo "$conflict_output"
  WARNS=$((WARNS + $(printf '%s\n' "$conflict_output" | wc -l | tr -d ' ')))
fi

printf 'Delegation check: %s failure(s), %s warning(s)\n' "$FAILS" "$WARNS"
if [ "$FAILS" -gt 0 ]; then
  exit 1
fi
if [ "$WARNS" -gt 0 ]; then
  exit 2
fi
exit 0
