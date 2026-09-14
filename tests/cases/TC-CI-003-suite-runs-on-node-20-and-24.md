---
id: TC-CI-003
title: The check runs on the Node versions the project supports
version: 1
status: approved
owner: marc.riegel@nimbusforge.de
created: 2026-09-14
updated: 2026-09-14
test_level: system
test_type: portability
design_technique: boundary-value-analysis
priority: medium
suite: regression
frequency: per-commit
automation: automated
script: tests/scripts/TC-CI-003.test.js
duration: 0.1s
environment: local-dev
last_reviewed: 2026-09-14
review_interval: 12m
stability: stable
references:
  - id: "#3/AC-3"
    type: acceptance-criterion
    source: https://github.com/mrcrgl/course-ai-test-automation-202609/issues/3
    demand: The suite runs on Node 20 and Node 24, and each version reports as its own check so it is visible which one failed.
---

# TC-CI-003 — The check runs on the Node versions the project supports

## Objective
Prove the suite is exercised on both ends of the range `package.json` declares — the oldest
Node it promises to support and the newest it is developed against — and that a failure names
the version it happened on.

## References
| Reference | Type | Source | What it demands |
| --- | --- | --- | --- |
| `#3/AC-3` | Acceptance criterion | Issue #3 — Run the test suite on every pull request against master | The suite runs on Node 20 and Node 24, each reporting as its own check |

## Preconditions
- `package.json` declares `"engines": { "node": ">=20" }`.
- The workflow defines a `suite` job with a `strategy.matrix`.

## Test Data
| Field | Value |
| --- | --- |
| Declared floor | `>=20` |
| Matrix values | `20`, `24` |
| Job name | must contain `${{ matrix.node-version }}` |
| `fail-fast` | `false` |

## Scenario

**Given** `package.json` declares Node 20 as the lowest supported version
**When** the matrix of the `suite` job is read
**Then** the matrix covers both Node 20 and Node 24
**And** the job name carries the Node version, so each version reports as its own check
**And** the job installs the Node version its matrix entry names
**And** `fail-fast` is off, so one version failing does not cancel the other's result

## Expected Result
Two checks appear per pull request — "Suite (Node 20)" and "Suite (Node 24)" — and they
report independently.

## Postconditions
- None — the case only reads files.

## Risk & Coverage
Not applicable — portability case, no threat model entry.

## Test Script
Implemented in `tests/scripts/TC-CI-003.test.js` — run with `npm test`.

```javascript
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { REPO, loadWorkflow } = require('./_workflow');

test('TC-CI-003 — the suite runs on Node 20 and Node 24, each reporting as its own check', () => {
  const engines = JSON.parse(fs.readFileSync(path.join(REPO, 'package.json'), 'utf8')).engines;
  assert.equal(engines.node, '>=20', 'package.json no longer declares Node 20 as the floor');

  const job = loadWorkflow().doc.jobs.suite;
  const versions = (job.strategy.matrix['node-version'] || []).map(String);

  assert.deepEqual(
    ['20', '24'].filter((v) => !versions.includes(v)),
    [],
    `the matrix runs on ${versions.join(', ') || 'nothing'} — it must cover Node 20 and Node 24`
  );
  assert.match(
    job.name,
    /\$\{\{\s*matrix\.node-version\s*\}\}/,
    'the job name does not carry the Node version, so the two checks cannot be told apart'
  );
  const setup = job.steps.find((s) => String(s.uses).startsWith('actions/setup-node'));
  assert.equal(
    setup && setup.with['node-version'],
    '${{ matrix.node-version }}',
    'the job does not install the Node version its matrix entry names'
  );
  assert.equal(
    job.strategy['fail-fast'],
    false,
    'fail-fast would cancel the other Node version before it reports its own result'
  );
});
```

## Change Log
| Version | Date | Author | Change | Reason |
| --- | --- | --- | --- | --- |
| 1 | 2026-09-14 | marc.riegel@nimbusforge.de | Created | Issue #3 AC-3 requires the suite to run on Node 20 and Node 24 as separate checks |

## Notes
The case is tied to the declared floor: if `engines.node` is ever raised, this case fails
first and forces the matrix and the declaration to be reconciled deliberately rather than
drifting apart. That is the point of asserting both in one place.
