---
id: TC-UI-007
title: The case list shows every case with its classification
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
script: tests/scripts/TC-UI-007.test.js
duration: 0.2s
environment: local-dev
last_reviewed: 2026-09-14
review_interval: 6m
stability: stable
references:
  - id: "#1/AC-3"
    type: acceptance-criterion
    source: https://github.com/mrcrgl/course-ai-test-automation-202609/issues/1
    demand: /cases lists one row per TC-*.md file showing ID, title, test type, priority, suite and automation from the front matter, each row linking to the detail page, with the total shown.
---

# TC-UI-007 — The case list shows every case with its classification

## Objective
Prove the listing is a complete and faithful index of `tests/cases/`: every file appears
once, with the classification actually written in its front matter, and the count on the
page matches the number of files on disk.

## References
| Reference | Type | Source | What it demands |
| --- | --- | --- | --- |
| `#1/AC-3` | Acceptance criterion | Issue #1 — Browse test cases and test runs in a login-gated web UI | One row per case file, showing ID, title, type, priority, suite and automation, linked, and the total |

## Preconditions
- The application is running at `http://localhost:3000`.
- The client has logged in as `admin` and holds the issued `sid` cookie.
- `tests/cases/` contains `TC-AUTH-003-login-wrong-password.md`.

## Test Data
| Field | Value |
| --- | --- |
| Path | `/cases` |
| Sampled case | `TC-AUTH-003` |
| Expected values | read from the front matter of the case file itself |

## Scenario

**Given** the client has logged in as `admin`
**When** it requests `/cases`
**Then** the page holds exactly one row per `TC-*.md` file in `tests/cases/`
**And** the row for `TC-AUTH-003` shows the title, test type, priority, suite and automation from that file's front matter
**And** that row links to `/cases/TC-AUTH-003`
**And** the page states the total number of cases

## Expected Result
The listing shows every case file with its classification read from disk, links each one to
its detail page, and reports the total.

## Postconditions
- None — the page is read-only and makes no state change.

## Risk & Coverage
Not applicable — functional case, no threat model entry.

## Test Script
Implemented in `tests/scripts/TC-UI-007.test.js` — run with `npm test`.

```javascript
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { useServer, login, get, testid } = require('./_harness');

const ctx = useServer();

const CASE_DIR = path.join(__dirname, '..', 'cases');
const field = (text, key) => (text.match(new RegExp(`^${key}: (.*)$`, 'm')) || [])[1];

/** The `<tr>` of the listing that links to the given case. */
const rowFor = (html, id) =>
  (html.match(new RegExp(`<tr[^>]*data-testid="case-row">(?:(?!</tr>)[\\s\\S])*?/cases/${id}"[\\s\\S]*?</tr>`)) || [])[0];

test('TC-UI-007 — the case list shows every case with its classification', async () => {
  const cookie = await login(ctx.base, 'admin', 'admin123');
  const files = fs.readdirSync(CASE_DIR).filter((f) => /^TC-.*\.md$/.test(f));
  const body = await (await get(`${ctx.base}/cases`, cookie)).text();

  assert.equal((body.match(/data-testid="case-row"/g) || []).length, files.length);

  const source = fs.readFileSync(path.join(CASE_DIR, 'TC-AUTH-003-login-wrong-password.md'), 'utf8');
  const row = rowFor(body, 'TC-AUTH-003');
  assert.ok(row, 'no row for TC-AUTH-003');
  for (const key of ['title', 'test_type', 'priority', 'suite', 'automation']) {
    assert.ok(row.includes(field(source, key)), `row is missing ${key}`);
  }

  assert.match(row, /<a href="\/cases\/TC-AUTH-003"/);
  assert.equal(testid(body, 'case-count'), String(files.length));
});
```

## Change Log
| Version | Date | Author | Change | Reason |
| --- | --- | --- | --- | --- |
| 1 | 2026-09-14 | marc.riegel@nimbusforge.de | Created | Issue #1 AC-3 requires the case list to be a complete index of the directory |

## Notes
The expected values are read from the case file at run time rather than hard-coded, so the
case does not need editing every time a sampled case is reclassified - and, more
importantly, it fails if the page shows a classification the file does not contain.
TC-UI-014 covers what the same listing does with a file it cannot parse.
