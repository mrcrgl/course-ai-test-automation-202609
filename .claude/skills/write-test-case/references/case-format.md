# Test case file format

The normative specification. Every file in `tests/cases/` follows it exactly;
`scripts/validate-cases.sh` enforces the mechanical parts.

## File naming

```
tests/cases/TC-<AREA>-<NNN>-<kebab-case-slug>.md
```

| Part | Rule |
| --- | --- |
| `AREA` | `UI`, `AUTH`, `SESS`, `API`, `SEC`, `CI`. Add a new area only when no existing one fits. |
| `NNN` | Zero-padded, unique within the area, **never reused** — a deleted case's number stays dead. |
| slug | Kebab-case, derived from the title, ≤ 6 words. |

The companion script lives at `tests/scripts/TC-<AREA>-<NNN>.test.js` — one script file per
case, named for the case, no slug.

## ISTQB / ISO-IEC-IEEE 29119-3 conformance

ISTQB defines a test case by the attributes standardised in ISO/IEC/IEEE 29119-3 (Test
Documentation), clause on test case specification. Every one of those attributes has a home
in this format:

| ISTQB / 29119-3 attribute | Where it lives here |
| --- | --- |
| Unique identifier | `id` (front matter), repeated in the `#` heading and the filename |
| Test case name / summary | `title` |
| Objective / description | `## Objective` |
| Priority | `priority` |
| Traceability to the test basis | `references` + `## References` |
| Preconditions (required state before execution) | `## Preconditions` |
| Inputs / test data | `## Test Data` |
| Actions / test steps | `## Scenario` (Given/When/Then) |
| Expected results | `## Expected Result`, plus the `**Then**` steps |
| Postconditions (state after execution) | `## Postconditions` |
| Test level | `test_level` |
| Test type | `test_type` |
| Test design technique | `design_technique` |
| Version / status / owner history | `version`, `status`, `owner`, `## Change Log` |
| Environment needs | `environment` |
| Automation status and implementation | `automation`, `script`, `## Test Script` |

Actual results and pass/fail verdicts are **not** stored in the case file — they belong to a
test run, and a case file is a specification. Keep run output in CI artifacts.

## Front matter

All keys are required, in this order. Values are lower-case; unknown values fail validation.

### Identity

| Key | Values | Notes |
| --- | --- | --- |
| `id` | `TC-<AREA>-<NNN>` | Must equal the filename prefix and the heading. |
| `title` | free text | Imperative statement of the behaviour. Must equal the heading text and the index row. |
| `version` | integer ≥ 1 | Bump on every substantive change; must equal the number of `## Change Log` rows. |
| `status` | `draft` \| `review` \| `approved` \| `deprecated` | `deprecated` cases stay in the repo; see BSI-P-09. |
| `owner` | email | Who answers questions about this case. |
| `created` | `YYYY-MM-DD` | Absolute date, never relative. |
| `updated` | `YYYY-MM-DD` | Date of the newest change-log row. |

### ISTQB classification

| Key | Values |
| --- | --- |
| `test_level` | `component` \| `integration` \| `system` \| `acceptance` |
| `test_type` | `functional` \| `security` \| `performance` \| `usability` \| `reliability` \| `portability` \| `maintainability` |
| `design_technique` | `equivalence-partitioning` \| `boundary-value-analysis` \| `decision-table` \| `state-transition` \| `use-case` \| `error-guessing` \| `checklist-based` \| `exploratory` |
| `priority` | `critical` \| `high` \| `medium` \| `low` — for `security` cases, derived via BSI-P-07 |

Pick the technique honestly. `error-guessing` and `exploratory` are legitimate; dressing a
guess up as boundary-value analysis is not.

### Recurrence and execution management

These are the fields that make a case a *recurring* (regression) test rather than a one-off
check. They answer: when does this run, who owns it, how long does it take, is it still
current?

| Key | Values | Notes |
| --- | --- | --- |
| `suite` | `smoke` \| `regression` \| `security` \| `exploratory` | Which suite selects this case. |
| `frequency` | `per-commit` \| `nightly` \| `release` \| `quarterly` \| `on-demand` | Execution cadence. For monitored-but-accepted risks, see BSI-P-10. |
| `automation` | `automated` \| `semi-automated` \| `manual` \| `planned` | `planned` means the script section holds a stub. |
| `script` | repo-relative path, or `none` | Must point at a file that exists, unless `automation: manual`. |
| `duration` | e.g. `2s`, `40s`, `5m` | Measured, not guessed. Feeds BSI-P-14 proportionality. |
| `environment` | `local-dev` \| `ci` \| `staging` | Minimum environment the case needs. |
| `last_reviewed` | `YYYY-MM-DD` | When a human last confirmed the case still reflects the requirement. |
| `review_interval` | `3m` \| `6m` \| `12m` | Per BSI-P-16. Short intervals for `security`, longer for stable `functional`. |
| `stability` | `stable` \| `flaky` \| `quarantined` | A `flaky` case must have a `## Notes` entry explaining why it has not been fixed. |

### Traceability

```yaml
references:
  - id: LLM-42/AC-3
    type: acceptance-criterion
    source: https://tracker.example.com/browse/LLM-42
    demand: "Given valid credentials, when the user submits, then the success page is shown."
  - id: BSI-P-11
    type: bsi-practice
    source: BSI-Standard 200-3 §7 — Suitability of security safeguards
    demand: "All aspects of the relevant threat must be covered in full."
```

Rules:

1. **At least one reference per case.** A case with no test basis is untraceable and fails
   validation (BSI-P-15).
2. `type` is `acceptance-criterion`, `bsi-practice`, or `derived`.
3. **Prefer the AC.** If the behaviour is in a ticket, reference the ticket — always, even
   if a BSI practice would also fit. BSI practices are for security behaviour no ticket
   covers.
4. `type: derived` is the last resort, for behaviour that is neither in a ticket nor
   security-relevant (e.g. a stylesheet loads). `source` then names the artefact the
   behaviour was read from, such as `server.js:42`.
5. `demand` quotes or paraphrases what the source actually requires — one sentence. It is
   what makes a stale reference visible when the source changes.

## Body sections

Exactly these, in this order. None may be omitted; write `Not applicable — <reason>` rather
than deleting one.

### `# <id> — <title>`
Em dash, spaces around it. Must reproduce `id` and `title` verbatim.

### `## Objective`
One or two sentences: what this case proves, in terms of behaviour, not implementation.

### `## References`
A table rendering the front-matter `references` for human readers:

```markdown
| Reference | Type | Source | What it demands |
| --- | --- | --- | --- |
| `BSI-P-11` | BSI practice | 200-3 §7 — Suitability | All aspects of the threat covered in full |
```

### `## Preconditions`
Bullet list of required starting state. Concrete and checkable — "the client holds no `sid`
cookie", not "the user is not logged in".

### `## Test Data`
Two-column table (`Field` | `Value`). Literal values in backticks. Show whitespace
explicitly with `␣`. Never put a real credential here — this repo's demo credentials are
fine, anything else is not.

### `## Scenario`
Given/When/Then, one step per line, keyword bold, blank line before the block:

```markdown
**Given** the client holds no session cookie
**And** the user is on the login page at `/`
**When** the user submits the form with `admin` / `wrongpassword`
**Then** the response status is `401`
**And** no `sid` cookie is set
```

- `**Given**` — state only, no actions.
- `**When**` — the action under test. Prefer exactly one; a second `**When**` is allowed
  only when the case is inherently a sequence (login *then* logout).
- `**Then**` — observable outcomes only. No assertions about internal variables.
- `**And**` continues whichever keyword precedes it.
- Every `**Then**`/`**And**` assertion must be checkable by the script in `## Test Script`.

### `## Expected Result`
The outcome in prose, one or two sentences. Redundant with the `**Then**` steps by design —
it is what a non-technical reader reads.

### `## Postconditions`
State after execution, including cleanup. "The session created by this case is destroyed"
or "None — the case makes no state change".

### `## Risk & Coverage`
**Required when `test_type: security`**, otherwise the single line
`Not applicable — <test_type> case, no threat model entry.`

```markdown
| Field | Value |
| --- | --- |
| Core value (BSI-P-01) | Confidentiality, Integrity |
| Elementary threat (BSI-P-02) | G 0.23 Unauthorised entry into IT systems |
| Frequency of occurrence (BSI-P-06) | `very-frequently` |
| Extent of damage (BSI-P-06) | `considerable` |
| Risk category (BSI-P-07) | `very-high` |
| Treatment option (BSI-P-08) | B — Risk reduction |
| Residual risk | Credentials are static and in source; accepted for a demo app. |
```

`priority` in the front matter must match what BSI-P-07's matrix yields from the frequency
and damage values here, or `## Notes` must justify the override.

### `## Test Script`
The executable check, inline. Two parts:

1. A line naming the file and how to run it:
   `` Implemented in `tests/scripts/TC-AUTH-003.test.js` — run with `npm test`. ``
2. A fenced code block containing the script.

The inline copy must stay identical to the file on disk; the validator compares them. If
`automation: planned` or `manual`, the block holds the manual steps or a stub with a
`TODO:` comment, and `script:` is `none`.

Script rules:
- One assertion per `**Then**`/`**And**` step, in the same order.
- The test name starts with the case ID: `test('TC-AUTH-003 — rejects a wrong password', …)`.
- Self-contained: it starts what it needs and tears it down. No dependence on another
  case having run first.
- No new dependencies without a good reason — `node:test`, `node:assert/strict` and
  `fetch` are built in and cover everything this repo needs.

### `## Change Log`
Newest first. One row per `version`.

```markdown
| Version | Date | Author | Change | Reason |
| --- | --- | --- | --- | --- |
| 2 | 2026-09-14 | marc.riegel@nimbusforge.de | Added assertion that no `sid` cookie is set | Review found the case passed even when a session leaked |
| 1 | 2026-09-14 | marc.riegel@nimbusforge.de | Created | Covers BSI-P-11 |
```

Rules: rows equal `version`; the top row's date equals `updated`; `Reason` says *why*, not
*what* — the `Change` column already says what. Never rewrite history, append.

### `## Notes`
Free text. Dependencies on sibling cases, known limitations, justified overrides, flakiness
explanations, and documented accepted risks (BSI-P-09). Write `None.` if empty.

## Validation

```bash
bash .claude/skills/write-test-case/scripts/validate-cases.sh
```

Checks IDs against filenames and headings, required keys and their allowed values, section
presence and order, at least one reference, Given/When/Then presence, change-log row count
against `version`, `updated` against the top row, script path existence, and that the inline
script matches the file on disk. Exit code 0 means conformant.
