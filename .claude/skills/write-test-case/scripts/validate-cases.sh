#!/usr/bin/env bash
# Validates every test case in tests/cases/ against references/case-format.md.
#
#   bash .claude/skills/write-test-case/scripts/validate-cases.sh [--strict]
#
# Files without a `version:` key are treated as legacy (pre-format) and only counted,
# unless --strict is given.

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)"
CASE_DIR="$REPO_ROOT/tests/cases"
STRICT=0
[ "${1:-}" = "--strict" ] && STRICT=1

RED=$'\033[31m'; YEL=$'\033[33m'; GRN=$'\033[32m'; DIM=$'\033[2m'; OFF=$'\033[0m'
[ -t 1 ] || { RED=""; YEL=""; GRN=""; DIM=""; OFF=""; }

errors=0
legacy=0
checked=0

SECTIONS=(
  "## Objective" "## References" "## Preconditions" "## Test Data" "## Scenario"
  "## Expected Result" "## Postconditions" "## Risk & Coverage" "## Test Script"
  "## Change Log" "## Notes"
)

KEYS=(
  id title version status owner created updated
  test_level test_type design_technique priority
  suite frequency automation script duration environment
  last_reviewed review_interval stability references
)

declare -A ALLOWED=(
  [status]="draft review approved deprecated"
  [test_level]="component integration system acceptance"
  [test_type]="functional security performance usability reliability portability maintainability"
  [design_technique]="equivalence-partitioning boundary-value-analysis decision-table state-transition use-case error-guessing checklist-based exploratory"
  [priority]="critical high medium low"
  [suite]="smoke regression security exploratory"
  [frequency]="per-commit nightly release quarterly on-demand"
  [automation]="automated semi-automated manual planned"
  [environment]="local-dev ci staging"
  [review_interval]="3m 6m 12m"
  [stability]="stable flaky quarantined"
)

fail() { printf '%s  FAIL%s %s: %s\n' "$RED" "$OFF" "$1" "$2"; errors=$((errors + 1)); }

frontmatter() { awk '/^---$/{n++; next} n==1' "$1"; }

# Extract the fenced code block inside ## Test Script.
inline_script() {
  awk '/^## Test Script$/{s=1; next} /^## /{s=0} s' "$1" \
    | awk '/^```/{f=!f; next} f'
}

for path in "$CASE_DIR"/TC-*.md; do
  [ -e "$path" ] || continue
  file="$(basename "$path")"
  fm="$(frontmatter "$path")"

  if ! grep -q '^version: ' <<<"$fm"; then
    legacy=$((legacy + 1))
    if [ "$STRICT" -eq 1 ]; then
      fail "$file" "legacy case, not migrated to the current format"
    else
      printf '%s  SKIP%s %s %s(legacy, not migrated)%s\n' "$YEL" "$OFF" "$file" "$DIM" "$OFF"
    fi
    continue
  fi
  checked=$((checked + 1))

  get() { grep -m1 "^$1: " <<<"$fm" | cut -d' ' -f2-; }

  # --- front matter: presence, order, allowed values -----------------------
  order_ok=1; prev=-1
  for key in "${KEYS[@]}"; do
    line="$(grep -n "^$key:" <<<"$fm" | head -1 | cut -d: -f1)"
    if [ -z "$line" ]; then fail "$file" "missing front-matter key '$key'"; continue; fi
    [ "$line" -gt "$prev" ] || order_ok=0
    prev="$line"
    if [ -n "${ALLOWED[$key]:-}" ]; then
      val="$(get "$key")"
      grep -qw -- "$val" <<<"${ALLOWED[$key]}" \
        || fail "$file" "$key: '$val' is not one of: ${ALLOWED[$key]}"
    fi
  done
  [ "$order_ok" -eq 1 ] || fail "$file" "front-matter keys are out of order"

  id="$(get id)"; title="$(get title)"; version="$(get version)"
  updated="$(get updated)"; automation="$(get automation)"; script="$(get script)"
  test_type="$(get test_type)"

  # --- identity ------------------------------------------------------------
  [ "${file%%-[0-9][0-9][0-9]-*}-$(grep -oE '[0-9]{3}' <<<"$file" | head -1)" = "$id" ] \
    || fail "$file" "id '$id' does not match the filename"
  grep -qxF "# $id — $title" "$path" \
    || fail "$file" "heading is not '# $id — $title'"
  for d in created updated last_reviewed; do
    v="$(get "$d")"
    grep -qE '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' <<<"$v" \
      || fail "$file" "$d: '$v' is not a YYYY-MM-DD date"
  done

  # --- references ----------------------------------------------------------
  refs="$(awk '/^references:/{r=1; next} /^[a-z_]+:/{r=0} r' <<<"$fm" | grep -c '^  - id: ')"
  [ "$refs" -ge 1 ] || fail "$file" "needs at least one entry under 'references'"
  awk '/^references:/{r=1; next} /^[a-z_]+:/{r=0} r' <<<"$fm" | grep '^    type: ' \
    | sed 's/^    type: //' | while read -r t; do
        grep -qw -- "$t" <<<"acceptance-criterion bsi-practice derived" \
          || printf '%s  FAIL%s %s: reference type '"'"'%s'"'"' is not allowed\n' "$RED" "$OFF" "$file" "$t"
      done | { grep . && errors=$((errors + 1)); } || true

  # --- sections: presence and order ----------------------------------------
  actual="$(grep '^## ' "$path")"
  expected="$(printf '%s\n' "${SECTIONS[@]}")"
  [ "$actual" = "$expected" ] || fail "$file" "sections missing or out of order"

  # --- Given / When / Then --------------------------------------------------
  for kw in Given When Then; do
    grep -q "^\*\*$kw\*\*" "$path" || fail "$file" "no '**$kw**' step in ## Scenario"
  done

  # --- security cases need a filled risk block ------------------------------
  if [ "$test_type" = "security" ]; then
    awk '/^## Risk & Coverage$/{s=1; next} /^## /{s=0} s' "$path" \
      | grep -q 'Elementary threat' \
      || fail "$file" "security case has no elementary threat in ## Risk & Coverage"
  fi

  # --- change log -----------------------------------------------------------
  rows="$(awk '/^## Change Log$/{s=1; next} /^## /{s=0} s' "$path" | grep -c '^| [0-9]')"
  [ "$rows" -eq "$version" ] \
    || fail "$file" "version is $version but the change log has $rows row(s)"
  top_date="$(awk '/^## Change Log$/{s=1; next} /^## /{s=0} s' "$path" \
    | grep -m1 '^| [0-9]' | awk -F'|' '{gsub(/ /,"",$3); print $3}')"
  [ "$top_date" = "$updated" ] \
    || fail "$file" "updated ($updated) does not match the newest change-log row ($top_date)"

  # --- script ---------------------------------------------------------------
  if [ "$automation" = "manual" ] || [ "$automation" = "planned" ]; then
    [ "$script" = "none" ] || fail "$file" "automation '$automation' requires script: none"
  else
    if [ ! -f "$REPO_ROOT/$script" ]; then
      fail "$file" "script '$script' does not exist"
    elif ! diff -q <(inline_script "$path") "$REPO_ROOT/$script" >/dev/null 2>&1; then
      fail "$file" "inline ## Test Script differs from $script"
    fi
  fi
  grep -q "test('$id" "$REPO_ROOT/$script" 2>/dev/null \
    || [ "$automation" = "manual" ] || [ "$automation" = "planned" ] \
    || fail "$file" "no test in $script whose name starts with '$id'"

  # --- index ----------------------------------------------------------------
  grep -qF "($file)" "$CASE_DIR/README.md" || fail "$file" "not listed in tests/cases/README.md"
done

echo "---"
printf 'checked: %d   legacy: %d   errors: %d\n' "$checked" "$legacy" "$errors"
if [ "$errors" -eq 0 ]; then
  printf '%sAll validated cases conform.%s\n' "$GRN" "$OFF"
  exit 0
fi
exit 1
