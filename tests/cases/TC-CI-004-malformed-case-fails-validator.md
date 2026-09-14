---
id: TC-CI-004
title: A malformed case file turns the check red
version: 1
status: approved
owner: marc.riegel@nimbusforge.de
created: 2026-09-14
updated: 2026-09-14
test_level: component
test_type: functional
design_technique: equivalence-partitioning
priority: high
suite: regression
frequency: per-commit
automation: automated
script: tests/scripts/TC-CI-004.test.js
duration: 1.5s
environment: local-dev
last_reviewed: 2026-09-14
review_interval: 6m
stability: stable
references:
  - id: "#3/AC-5"
    type: acceptance-criterion
    source: https://github.com/mrcrgl/course-ai-test-automation-202609/issues/3
    demand: A case file that does not conform to the format - change-log rows disagreeing with version, an inline test script differing from the file on disk, a missing front-matter key - fails the validator step, and the log names the file and the rule it broke.
---

# TC-CI-004 — A malformed case file turns the check red

## Objective
Prove the validator step is a real gate: each of the three malformations the criterion names
is rejected, non-zero, with a message that names the offending file and the rule it broke.

## References
| Reference | Type | Source | What it demands |
| --- | --- | --- | --- |
| `#3/AC-5` | Acceptance criterion | Issue #3 — Run the test suite on every pull request against master | A non-conforming case file fails the validator step, and the log names the file and the rule |

## Preconditions
- `bash` and the validator script are available.
- The case used as the fixture, `TC-AUTH-003`, conforms to the format and has its script on disk.
- Nothing under this repository's own `tests/` is modified: every malformation is applied to
  a copy in the system temporary directory.

## Test Data
| Field | Value |
| --- | --- |
| Fixture case | `tests/cases/TC-AUTH-003-login-wrong-password.md` |
| Fixture script | `tests/scripts/TC-AUTH-003.test.js` |
| Malformation 1 | `version: 7` against a change log that still has one row |
| Malformation 2 | a line appended to the script on disk, leaving the inline copy stale |
| Malformation 3 | the `priority:` line removed from the front matter |
| Expected exit code | `1` |

## Scenario

**Given** a fixture repository holding the validator and one conformant case file
**And** the validator accepts that fixture before anything is changed
**When** each of the three malformations is applied to its own fresh copy and validated
**Then** the copy whose `version` disagrees with its change log is reported by file and rule
**And** the copy whose inline `## Test Script` differs from the file on disk is reported the same way
**And** the copy missing a front-matter key is reported by file and by the missing key
**And** all three exit `1`, so the validator step fails the job

## Expected Result
Every malformation is refused with an identifying message, and the non-zero exit is what the
workflow step turns into a red check.

## Postconditions
- The temporary fixture directories are left in the system temporary directory; nothing under
  the repository's `tests/` is touched.

## Risk & Coverage
Not applicable — functional case, no threat model entry.

## Test Script
Implemented in `tests/scripts/TC-CI-004.test.js` — run with `npm test`.

```javascript
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { REPO } = require('./_workflow');

const VALIDATOR = '.claude/skills/write-test-case/scripts/validate-cases.sh';
const CASE = 'TC-AUTH-003-login-wrong-password.md';
const SCRIPT = 'tests/scripts/TC-AUTH-003.test.js';

/**
 * A miniature repository holding the validator and one conformant case, so a malformed file
 * can be validated without touching this repository's own cases. The validator locates the
 * repository from its own path, which is why the skill's directory layout is reproduced.
 */
function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tc-ci-004-'));
  for (const dir of [path.dirname(VALIDATOR), 'tests/cases', 'tests/scripts']) {
    fs.mkdirSync(path.join(root, dir), { recursive: true });
  }
  for (const file of [VALIDATOR, `tests/cases/${CASE}`, SCRIPT]) {
    fs.copyFileSync(path.join(REPO, file), path.join(root, file));
  }
  fs.writeFileSync(path.join(root, 'tests/cases/README.md'), `| [TC-AUTH-003](${CASE}) |\n`);
  return root;
}

function validate(root) {
  const r = spawnSync('bash', [path.join(root, VALIDATOR), '--strict'], { encoding: 'utf8' });
  return { status: r.status, output: `${r.stdout}${r.stderr}` };
}

/** Applies one malformation to a fresh fixture and validates it. */
function malform(rel, edit) {
  const root = fixture();
  const file = path.join(root, rel);
  fs.writeFileSync(file, edit(fs.readFileSync(file, 'utf8')));
  return validate(root);
}

test('TC-CI-004 — a malformed case file fails the validator step', () => {
  const clean = validate(fixture());
  assert.equal(clean.status, 0, `the fixture is malformed before anything is changed:\n${clean.output}`);

  // `version: 7` against a change log that still has one row.
  const rows = malform(`tests/cases/${CASE}`, (t) => t.replace(/^version: \d+$/m, 'version: 7'));
  // The inline copy of the script no longer matches the file it claims to reproduce.
  const drift = malform(SCRIPT, (t) => `${t}\n// edited without updating the case file\n`);
  // A required front-matter key is gone.
  const missing = malform(`tests/cases/${CASE}`, (t) => t.replace(/^priority: .*\n/m, ''));

  assert.match(
    rows.output,
    new RegExp(`FAIL ${CASE}: version is 7 but the change log has \\d+ row`),
    `a version disagreeing with the change log was not reported against ${CASE}:\n${rows.output}`
  );
  assert.match(
    drift.output,
    new RegExp(`FAIL ${CASE}: inline ## Test Script differs from ${SCRIPT}`),
    `an inline script differing from the file on disk was not reported:\n${drift.output}`
  );
  assert.match(
    missing.output,
    new RegExp(`FAIL ${CASE}: missing front-matter key 'priority'`),
    `a missing front-matter key was not reported:\n${missing.output}`
  );
  assert.deepEqual(
    [rows.status, drift.status, missing.status],
    [1, 1, 1],
    'a malformed case file did not exit non-zero, so the validator step would not fail the job'
  );
});
```

## Change Log
| Version | Date | Author | Change | Reason |
| --- | --- | --- | --- | --- |
| 1 | 2026-09-14 | marc.riegel@nimbusforge.de | Created | Issue #3 AC-5 requires a malformed case file to fail the check, naming the file and the rule |

## Notes
The validator finds the repository from its own location, so it can only ever validate the
tree it sits in. Copying it into a miniature repository is what makes a negative test possible
without breaking a real case file — the alternative, malforming a case in place and reverting
it, would leave the suite red for anyone running it at the same moment.

The fixture holds one case rather than all of them, which keeps four validator runs at roughly
half a second in total.
