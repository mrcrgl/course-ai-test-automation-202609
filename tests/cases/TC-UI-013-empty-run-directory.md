---
id: TC-UI-013
title: An empty run directory renders an empty state, not an error
version: 1
status: approved
owner: marc.riegel@nimbusforge.de
created: 2026-09-14
updated: 2026-09-14
test_level: system
test_type: reliability
design_technique: boundary-value-analysis
priority: medium
suite: regression
frequency: per-commit
automation: automated
script: tests/scripts/TC-UI-013.test.js
duration: 0.1s
environment: local-dev
last_reviewed: 2026-09-14
review_interval: 6m
stability: stable
references:
  - id: "#1/AC-11"
    type: acceptance-criterion
    source: https://github.com/mrcrgl/course-ai-test-automation-202609/issues/1
    demand: With no run reports on disk, /runs returns 200 and states that no runs have been recorded yet.
---

# TC-UI-013 — An empty run directory renders an empty state, not an error

## Objective
Prove the zero case is handled: a checkout that has never recorded a run gets a page
explaining that, rather than a crash or a blank table.

## References
| Reference | Type | Source | What it demands |
| --- | --- | --- | --- |
| `#1/AC-11` | Acceptance criterion | Issue #1 — Browse test cases and test runs in a login-gated web UI | An empty `tests/runs/` produces 200 and a statement that no runs have been recorded |

## Preconditions
- The application is running at `http://localhost:3000`.
- The client has logged in as `admin` and holds the issued `sid` cookie.
- `TESTS_DIR` points at a fixture directory whose `runs/` is empty.

## Test Data
| Field | Value |
| --- | --- |
| Path | `/runs` |
| Fixture | a temporary directory containing empty `cases/` and `runs/` |

## Scenario

**Given** the client has logged in as `admin`
**And** the run directory contains no reports
**When** it requests `/runs`
**Then** the response status is `200`
**And** the page carries the empty-state element
**And** the page states that no runs have been recorded yet
**And** the page contains no run rows

## Expected Result
The run list renders an explanatory empty state and stays at `200`.

## Postconditions
- The fixture directory stays in the temporary directory; `TESTS_DIR` is restored.

## Risk & Coverage
Not applicable — reliability case, no threat model entry.

## Test Script
Implemented in `tests/scripts/TC-UI-013.test.js` — run with `npm test`.

```javascript
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { useServer, login, get } = require('./_harness');

const ctx = useServer();

test('TC-UI-013 — an empty run directory renders an empty state, not an error', async () => {
  const cookie = await login(ctx.base, 'admin', 'admin123');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tc-ui-013-'));
  fs.mkdirSync(path.join(dir, 'cases'));
  fs.mkdirSync(path.join(dir, 'runs'));

  const previous = process.env.TESTS_DIR;
  process.env.TESTS_DIR = dir;
  try {
    const res = await get(`${ctx.base}/runs`, cookie);
    const body = await res.text();

    assert.equal(res.status, 200);
    assert.match(body, /data-testid="empty-runs"/);
    assert.match(body, /No runs have been recorded yet/);
    assert.doesNotMatch(body, /data-testid="run-row"/);
  } finally {
    if (previous === undefined) delete process.env.TESTS_DIR;
    else process.env.TESTS_DIR = previous;
  }
});
```

## Change Log
| Version | Date | Author | Change | Reason |
| --- | --- | --- | --- | --- |
| 1 | 2026-09-14 | marc.riegel@nimbusforge.de | Created | Issue #1 AC-11 requires an empty directory to produce an empty state rather than an error |

## Notes
`tests/runs/` in this repository is never empty — it holds the committed evidence — so the
boundary is reached by pointing `TESTS_DIR` at a temporary fixture for the duration of the
request and restoring it afterwards. The variable exists for exactly this: reaching states
the repository cannot be put into without deleting its own history.
