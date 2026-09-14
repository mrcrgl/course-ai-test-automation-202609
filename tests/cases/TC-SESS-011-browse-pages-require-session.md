---
id: TC-SESS-011
title: The case and run browsers are unreachable without a session
version: 1
status: approved
owner: marc.riegel@nimbusforge.de
created: 2026-09-14
updated: 2026-09-14
test_level: system
test_type: security
design_technique: equivalence-partitioning
priority: high
suite: security
frequency: per-commit
automation: automated
script: tests/scripts/TC-SESS-011.test.js
duration: 0.2s
environment: local-dev
last_reviewed: 2026-09-14
review_interval: 3m
stability: stable
references:
  - id: "#1/AC-1"
    type: acceptance-criterion
    source: https://github.com/mrcrgl/course-ai-test-automation-202609/issues/1
    demand: A client with no valid session cookie requesting any of the four browse routes receives 302 to / and none of the requested content.
---

# TC-SESS-011 — The case and run browsers are unreachable without a session

## Objective
Prove that all four pages added by issue #1 are behind the same session guard as
`/success`: without a session cookie each one redirects to the login page and discloses
nothing of what was asked for.

## References
| Reference | Type | Source | What it demands |
| --- | --- | --- | --- |
| `#1/AC-1` | Acceptance criterion | Issue #1 — Browse test cases and test runs in a login-gated web UI | Every new page answers 302 to `/` without a session, and leaks no content |

## Preconditions
- The application is running at `http://localhost:3000`.
- The client holds no `sid` session cookie.
- `tests/runs/` contains at least one recorded run.

## Test Data
| Field | Value |
| --- | --- |
| Paths | `/cases`, `/cases/TC-AUTH-003`, `/runs`, `/runs/<newest run id>` |
| Cookie | none |

## Scenario

**Given** the client holds no `sid` session cookie
**When** it requests each of `/cases`, `/cases/:id`, `/runs` and `/runs/:id`
**Then** every response status is `302`
**And** every response carries `Location: /`
**And** no response body contains any of the requested content

## Expected Result
All four routes bounce an anonymous client to the login page, and the redirect body carries
neither the listings nor the content of the case or run that was requested.

## Postconditions
- None — no session exists before or after the case.

## Risk & Coverage
| Field | Value |
| --- | --- |
| Core value (BSI-P-01) | Confidentiality |
| Elementary threat (BSI-P-02) | G 0.23 Unauthorised entry into IT systems |
| Frequency of occurrence (BSI-P-06) | `very-frequently` — requesting a known URL without credentials is the first thing any scanner tries |
| Extent of damage (BSI-P-06) | `limited` — what leaks is test documentation: case specifications, commit hashes, host names and author addresses |
| Risk category (BSI-P-07) | `high` (limited × very-frequently) |
| Treatment option (BSI-P-08) | B — Risk reduction: the `requireSession` middleware in `server.js` is the safeguard |
| Residual risk | The guard is only as strong as the session store it reads, which is an in-memory map keyed by a `Math.random` identifier; TC-SESS-005 and TC-SESS-008 cover that side. |

## Test Script
Implemented in `tests/scripts/TC-SESS-011.test.js` — run with `npm test`.

```javascript
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { useServer, get } = require('./_harness');

const ctx = useServer();

const newestRun = fs
  .readdirSync(path.join(__dirname, '..', 'runs'))
  .filter((f) => /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z\.md$/.test(f))
  .sort()
  .pop()
  .slice(0, -3);

test('TC-SESS-011 — the browse pages are unreachable without a session', async () => {
  const paths = ['/cases', '/cases/TC-AUTH-003', '/runs', `/runs/${newestRun}`];

  for (const p of paths) {
    const res = await get(`${ctx.base}${p}`);
    const body = await res.text();

    assert.equal(res.status, 302, `${p} did not redirect`);
    assert.equal(res.headers.get('location'), '/', `${p} redirected elsewhere`);
    assert.doesNotMatch(
      body,
      /data-testid="(case-table|case-meta|run-table|run-report)"|TC-AUTH-003|Login is rejected/,
      `${p} leaked content to an unauthenticated client`
    );
  }
});
```

## Change Log
| Version | Date | Author | Change | Reason |
| --- | --- | --- | --- | --- |
| 1 | 2026-09-14 | marc.riegel@nimbusforge.de | Created | Issue #1 AC-1 requires the four new browse routes to sit behind the existing session guard |

## Notes
The case deliberately requests one detail page of each kind as well as the two lists: a
guard applied to the list route but forgotten on the parameterised route is exactly the
mistake this covers. TC-SESS-001 covers the same guard on `/success`.
