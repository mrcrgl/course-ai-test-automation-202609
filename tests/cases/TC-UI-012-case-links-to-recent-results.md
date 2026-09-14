---
id: TC-UI-012
title: A case links back to its most recent recorded results
version: 1
status: approved
owner: marc.riegel@nimbusforge.de
created: 2026-09-14
updated: 2026-09-14
test_level: integration
test_type: functional
design_technique: use-case
priority: medium
suite: regression
frequency: per-commit
automation: automated
script: tests/scripts/TC-UI-012.test.js
duration: 0.1s
environment: local-dev
last_reviewed: 2026-09-14
review_interval: 6m
stability: stable
references:
  - id: "#1/AC-7"
    type: acceptance-criterion
    source: https://github.com/mrcrgl/course-ai-test-automation-202609/issues/1
    demand: A case that appears in at least one recorded run shows that case's most recent results, each linking to the run it came from.
---

# TC-UI-012 — A case links back to its most recent recorded results

## Objective
Prove a specification carries its evidence: the case page shows how the case actually
performed in the most recent runs that executed it, and each result opens that run.

## References
| Reference | Type | Source | What it demands |
| --- | --- | --- | --- |
| `#1/AC-7` | Acceptance criterion | Issue #1 — Browse test cases and test runs in a login-gated web UI | A case shows its most recent results, each linking to the run it came from |

## Preconditions
- The application is running at `http://localhost:3000`.
- The client has logged in as `admin` and holds the issued `sid` cookie.
- At least one report in `tests/runs/` records a result for `TC-AUTH-003`.

## Test Data
| Field | Value |
| --- | --- |
| Path | `/cases/TC-AUTH-003` |
| Expected run | the newest report in `tests/runs/` mentioning `TC-AUTH-003` |

## Scenario

**Given** the client has logged in as `admin`
**And** the newest run that executed `TC-AUTH-003` is known from `tests/runs/`
**When** it requests `/cases/TC-AUTH-003`
**Then** the page shows a recent-results table
**And** that table links to the newest run that executed the case
**And** the recorded result is shown
**And** following that link returns `200`

## Expected Result
The case page lists its most recent results, newest first, and each row links to the run
report the result was read from.

## Postconditions
- None — the pages are read-only and make no state change.

## Risk & Coverage
Not applicable — functional case, no threat model entry.

## Test Script
Implemented in `tests/scripts/TC-UI-012.test.js` — run with `npm test`.

```javascript
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { useServer, login, get } = require('./_harness');

const ctx = useServer();

test('TC-UI-012 — a case links back to its most recent recorded results', async () => {
  const cookie = await login(ctx.base, 'admin', 'admin123');
  const runs = fs
    .readdirSync(path.join(__dirname, '..', 'runs'))
    .filter((f) => /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z\.md$/.test(f))
    .sort()
    .reverse();
  const newest = runs.find((f) =>
    fs.readFileSync(path.join(__dirname, '..', 'runs', f), 'utf8').includes('TC-AUTH-003')
  );
  assert.ok(newest, 'no recorded run covers TC-AUTH-003');

  const body = await (await get(`${ctx.base}/cases/TC-AUTH-003`, cookie)).text();
  const results = (body.match(/<table class="grid" data-testid="case-results">[\s\S]*?<\/table>/) || [])[0];

  assert.ok(results, 'the case page shows no results table');
  assert.match(results, new RegExp(`<a href="/runs/${newest.slice(0, -3)}"`));
  assert.match(results, /badge-pass">PASS</);

  const res = await get(`${ctx.base}/runs/${newest.slice(0, -3)}`, cookie);
  assert.equal(res.status, 200);
});
```

## Change Log
| Version | Date | Author | Change | Reason |
| --- | --- | --- | --- | --- |
| 1 | 2026-09-14 | marc.riegel@nimbusforge.de | Created | Issue #1 AC-7 requires a case to link back to the runs that executed it |

## Notes
The expected run is found by scanning `tests/runs/` newest first for one that mentions the
case, so the case survives future runs being added and does not assume the newest run
covered every case. TC-UI-011 covers the opposite direction.
