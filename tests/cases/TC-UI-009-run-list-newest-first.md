---
id: TC-UI-009
title: The run list shows every recorded run, newest first
version: 1
status: approved
owner: marc.riegel@nimbusforge.de
created: 2026-09-14
updated: 2026-09-14
test_level: system
test_type: functional
design_technique: checklist-based
priority: high
suite: regression
frequency: per-commit
automation: automated
script: tests/scripts/TC-UI-009.test.js
duration: 0.1s
environment: local-dev
last_reviewed: 2026-09-14
review_interval: 6m
stability: stable
references:
  - id: "#1/AC-5"
    type: acceptance-criterion
    source: https://github.com/mrcrgl/course-ai-test-automation-202609/issues/1
    demand: /runs lists one row per run report, newest first, each showing timestamp, verdict, passed/failed/skipped counts, short commit hash and wall-clock duration, linked to the detail page.
---

# TC-UI-009 — The run list shows every recorded run, newest first

## Objective
Prove the run index is complete, ordered so the most recent evidence is first, and that
each row carries the figures a reader needs to decide whether to open the report.

## References
| Reference | Type | Source | What it demands |
| --- | --- | --- | --- |
| `#1/AC-5` | Acceptance criterion | Issue #1 — Browse test cases and test runs in a login-gated web UI | One row per report, newest first, with timestamp, verdict, counts, short commit and duration, linked |

## Preconditions
- The application is running at `http://localhost:3000`.
- The client has logged in as `admin` and holds the issued `sid` cookie.
- `tests/runs/` contains at least one report named `<ISO timestamp>.md`.

## Test Data
| Field | Value |
| --- | --- |
| Path | `/runs` |
| Sampled run | the newest file in `tests/runs/` |
| Expected values | read from that report's own tables |

## Scenario

**Given** the client has logged in as `admin`
**When** it requests `/runs`
**Then** the page holds exactly one row per run report in `tests/runs/`
**And** the rows appear in descending run-identifier order, newest first
**And** the newest row shows that report's timestamp, verdict, passed, failed and skipped counts, short commit hash and wall-clock duration
**And** that row links to `/runs/<run id>`
**And** the page states the number of recorded runs

## Expected Result
Every recorded run is listed newest first, with the headline figures read from the report
itself, and each row opens the full report.

## Postconditions
- None — the page is read-only and makes no state change.

## Risk & Coverage
Not applicable — functional case, no threat model entry.

## Test Script
Implemented in `tests/scripts/TC-UI-009.test.js` — run with `npm test`.

```javascript
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { useServer, login, get, testid } = require('./_harness');

const ctx = useServer();

const RUN_DIR = path.join(__dirname, '..', 'runs');
const RUN_FILE = /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z\.md$/;
const cell = (text, key) => (text.match(new RegExp(`^\\| ${key} \\| (.*) \\|$`, 'm')) || [])[1];

test('TC-UI-009 — the run list shows every recorded run, newest first', async () => {
  const cookie = await login(ctx.base, 'admin', 'admin123');
  const files = fs.readdirSync(RUN_DIR).filter((f) => RUN_FILE.test(f));
  const body = await (await get(`${ctx.base}/runs`, cookie)).text();

  assert.equal((body.match(/data-testid="run-row"/g) || []).length, files.length);

  const listed = [...body.matchAll(/href="\/runs\/([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(listed, [...files].sort().reverse().map((f) => f.slice(0, -3)));

  const newest = listed[0];
  const source = fs.readFileSync(path.join(RUN_DIR, `${newest}.md`), 'utf8');
  const row = (body.match(new RegExp(`<tr[^>]*data-testid="run-row">[\\s\\S]*?</tr>`)) || [])[0];
  assert.ok(row.includes(newest.replace(/T(\d{2})-(\d{2})-(\d{2})Z$/, 'T$1:$2:$3Z')), 'no run timestamp');
  assert.ok(row.includes(/^\*\*(PASS|FAIL)\*\*/m.exec(source)[1]), 'no verdict');
  for (const key of ['Passed', 'Failed', 'Skipped']) {
    assert.ok(row.includes(`>${cell(source, key)}<`), `no ${key} count`);
  }
  assert.ok(row.includes(cell(source, 'Commit').replace(/`/g, '')), 'no short commit hash');
  assert.ok(row.includes(cell(source, 'Wall clock')), 'no wall-clock duration');
  assert.match(row, new RegExp(`<a href="/runs/${newest}"`));
  assert.equal(testid(body, 'run-count'), String(files.length));
});
```

## Change Log
| Version | Date | Author | Change | Reason |
| --- | --- | --- | --- | --- |
| 1 | 2026-09-14 | marc.riegel@nimbusforge.de | Created | Issue #1 AC-5 requires the run list to be complete, ordered and informative |

## Notes
Ordering is asserted against the sorted-and-reversed directory listing rather than a fixed
sequence, so the case keeps working as runs accumulate. Run identifiers are ISO timestamps,
which makes descending name order the same as descending time order — if the naming scheme
in the `run-test-cases` skill ever changes, this assumption has to be revisited.
