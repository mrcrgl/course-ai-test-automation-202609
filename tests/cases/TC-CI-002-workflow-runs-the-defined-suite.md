---
id: TC-CI-002
title: The check runs the suite the way the repository defines it
version: 1
status: approved
owner: marc.riegel@nimbusforge.de
created: 2026-09-14
updated: 2026-09-14
test_level: system
test_type: functional
design_technique: checklist-based
priority: critical
suite: regression
frequency: per-commit
automation: automated
script: tests/scripts/TC-CI-002.test.js
duration: 0.1s
environment: local-dev
last_reviewed: 2026-09-14
review_interval: 6m
stability: stable
references:
  - id: "#3/AC-2"
    type: acceptance-criterion
    source: https://github.com/mrcrgl/course-ai-test-automation-202609/issues/3
    demand: The workflow installs with npm ci against the committed lockfile, executes the case scripts through npm run test:report, runs the case validator with --strict, and fails the job on any non-zero exit.
---

# TC-CI-002 — The check runs the suite the way the repository defines it

## Objective
Prove the check runs the repository's own commands rather than a private variant of them, and
that a non-zero exit from any of them actually turns the job red.

## References
| Reference | Type | Source | What it demands |
| --- | --- | --- | --- |
| `#3/AC-2` | Acceptance criterion | Issue #3 — Run the test suite on every pull request against master | `npm ci`, then `npm run test:report`, then the validator with `--strict`; a non-zero exit from any of them fails the job |

## Preconditions
- The repository contains `.github/workflows/tests.yml` with a job named `suite`.
- `package-lock.json` is committed, so `npm ci` has something to install from.

## Test Data
| Field | Value |
| --- | --- |
| Install command | `npm ci` |
| Suite command | `npm run test:report` |
| Validator command | `bash .claude/skills/write-test-case/scripts/validate-cases.sh --strict` |
| Failure-swallowing patterns | `continue-on-error: true`, a discarded exit code, `set +e` |

## Scenario

**Given** the repository contains a committed `package-lock.json`
**When** the steps of the `suite` job are read
**Then** a step installs dependencies with `npm ci`
**And** a step executes the case scripts through `npm run test:report`
**And** a step runs the case-format validator with `--strict`
**And** the install step runs before the suite step
**And** no step tolerates its own failure with `continue-on-error`
**And** none of the three commands discards its exit code
**And** the piped suite command runs under a shell that sets `pipefail`

## Expected Result
The job runs the three commands the repository already defines, in a usable order, with
nothing in the way of a failure reaching the job's conclusion.

## Postconditions
- None — the case only reads files.

## Risk & Coverage
Not applicable — functional case, no threat model entry.

## Test Script
Implemented in `tests/scripts/TC-CI-002.test.js` — run with `npm test`.

```javascript
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { REPO, loadWorkflow, runCommands } = require('./_workflow');

const VALIDATOR = '.claude/skills/write-test-case/scripts/validate-cases.sh --strict';

test('TC-CI-002 — the workflow runs the suite the way the repository defines it', () => {
  assert.ok(
    fs.existsSync(path.join(REPO, 'package-lock.json')),
    'package-lock.json is not committed, so npm ci has nothing to install from'
  );

  const { doc } = loadWorkflow();
  const job = doc.jobs.suite;
  const commands = runCommands(job);
  const find = (needle) => commands.findIndex((c) => c.includes(needle));

  const install = find('npm ci');
  const suite = find('npm run test:report');
  const validator = find(VALIDATOR);

  assert.ok(install >= 0, 'no step installs dependencies with npm ci');
  assert.ok(suite >= 0, 'no step executes the case scripts through npm run test:report');
  assert.ok(validator >= 0, `no step runs the case-format validator: ${VALIDATOR}`);
  assert.ok(install < suite, 'dependencies are installed after the suite has already run');
  assert.deepEqual(
    job.steps.filter((s) => s['continue-on-error'] === true).map((s) => s.name),
    [],
    'a step tolerates its own failure, so a non-zero exit would not fail the job'
  );
  assert.deepEqual(
    [install, suite, validator].filter((i) => /\|\|\s*true|set \+e/.test(commands[i])),
    [],
    'a step discards the exit code of the command it runs'
  );
  // A piped command only fails the step when the shell sets pipefail, which `shell: bash` does.
  assert.ok(
    !commands[suite].includes('|') || doc.defaults.run.shell === 'bash',
    'the suite command is piped but the job does not use `shell: bash`, so a failing suite ' +
      'on the left of the pipe would be reported as success'
  );
});
```

## Change Log
| Version | Date | Author | Change | Reason |
| --- | --- | --- | --- | --- |
| 1 | 2026-09-14 | marc.riegel@nimbusforge.de | Created | Issue #3 AC-2 requires the check to run the repository's own commands and to fail on any of them |

## Notes
The `pipefail` assertion is the subtle one. The suite command is piped into `tee` so the
summary step can find the report that was written, and a shell without `pipefail` reports
the exit code of `tee` — which always succeeds. `shell: bash` in `defaults.run` is what
makes a failing suite fail the step; removing it would produce a check that is green no
matter what the suite did.
