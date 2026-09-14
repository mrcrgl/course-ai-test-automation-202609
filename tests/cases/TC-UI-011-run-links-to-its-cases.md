---
id: TC-UI-011
title: A run report links to each case it executed
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
script: tests/scripts/TC-UI-011.test.js
duration: 0.2s
environment: local-dev
last_reviewed: 2026-09-14
review_interval: 6m
stability: stable
references:
  - id: "#1/AC-7"
    type: acceptance-criterion
    source: https://github.com/mrcrgl/course-ai-test-automation-202609/issues/1
    demand: Following the link on a case ID in a run's results table arrives at that case's detail page.
---

# TC-UI-011 — A run report links to each case it executed

## Objective
Prove the results table turns each case ID into a working link, so a reader looking at a
result can reach the specification that produced it without leaving the browser.

## References
| Reference | Type | Source | What it demands |
| --- | --- | --- | --- |
| `#1/AC-7` | Acceptance criterion | Issue #1 — Browse test cases and test runs in a login-gated web UI | A case ID in a run's results table links to that case's detail page |

## Preconditions
- The application is running at `http://localhost:3000`.
- The client has logged in as `admin` and holds the issued `sid` cookie.
- `tests/runs/` contains at least one report with results.

## Test Data
| Field | Value |
| --- | --- |
| Path | `/runs/<newest run id>` |
| Followed links | the first three case links in the results table |

## Scenario

**Given** the client has logged in as `admin`
**And** it is viewing the newest run's detail page
**When** it follows each of the first three case links in the results table
**Then** the results table contains at least one case link
**And** every followed link returns `200`
**And** every followed link lands on the detail page of the case named by the link

## Expected Result
Case IDs in a run report are links into `/cases/<id>`, and each one opens that case's page.

## Postconditions
- None — the pages are read-only and make no state change.

## Risk & Coverage
Not applicable — functional case, no threat model entry.

## Test Script
Implemented in `tests/scripts/TC-UI-011.test.js` — run with `npm test`.

```javascript
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { useServer, login, get } = require('./_harness');

const ctx = useServer();

test('TC-UI-011 — a run report links to each case it executed', async () => {
  const cookie = await login(ctx.base, 'admin', 'admin123');
  const newest = fs
    .readdirSync(path.join(__dirname, '..', 'runs'))
    .filter((f) => /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z\.md$/.test(f))
    .sort()
    .pop()
    .slice(0, -3);

  const report = await (await get(`${ctx.base}/runs/${newest}`, cookie)).text();
  const links = [...report.matchAll(/<a href="(\/cases\/(TC-[A-Z]+-\d{3}))"/g)];
  assert.ok(links.length > 0, 'the results table links to no case at all');

  for (const [, href, id] of links.slice(0, 3)) {
    const res = await get(`${ctx.base}${href}`, cookie);
    const body = await res.text();
    assert.equal(res.status, 200, `${href} did not resolve`);
    assert.match(body, new RegExp(`<h1>${id} — `), `${href} is not the page for ${id}`);
  }
});
```

## Change Log
| Version | Date | Author | Change | Reason |
| --- | --- | --- | --- | --- |
| 1 | 2026-09-14 | marc.riegel@nimbusforge.de | Created | Issue #1 AC-7 requires a run to link to the cases it executed |

## Notes
The report files link to cases by relative file path (`../cases/<file>.md`); the page has to
rewrite those into application routes. The case follows the rendered links rather than
constructing them, so a rewrite that produces a plausible but dead URL fails here.
TC-UI-012 covers the opposite direction.
