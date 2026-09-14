---
id: TC-UI-006
title: The success page links to the case and run browsers
version: 1
status: approved
owner: marc.riegel@nimbusforge.de
created: 2026-09-14
updated: 2026-09-14
test_level: system
test_type: functional
design_technique: use-case
priority: medium
suite: regression
frequency: per-commit
automation: automated
script: tests/scripts/TC-UI-006.test.js
duration: 0.2s
environment: local-dev
last_reviewed: 2026-09-14
review_interval: 6m
stability: stable
references:
  - id: "#1/AC-2"
    type: acceptance-criterion
    source: https://github.com/mrcrgl/course-ai-test-automation-202609/issues/1
    demand: The success page links to /cases and to /runs, and both links resolve to 200 for a logged-in user.
---

# TC-UI-006 — The success page links to the case and run browsers

## Objective
Prove the new pages are reachable by navigation rather than only by typing a URL: after
logging in, the success page offers both entry points and both of them answer.

## References
| Reference | Type | Source | What it demands |
| --- | --- | --- | --- |
| `#1/AC-2` | Acceptance criterion | Issue #1 — Browse test cases and test runs in a login-gated web UI | The success page links to `/cases` and `/runs`; both resolve to 200 for that user |

## Preconditions
- The application is running at `http://localhost:3000`.
- The client has logged in as `admin` and holds the issued `sid` cookie.

## Test Data
| Field | Value |
| --- | --- |
| Username | `admin` |
| Password | `admin123` |

## Scenario

**Given** the client has logged in as `admin`
**When** it requests `/success`
**Then** the page contains a link to `/cases` marked `data-testid="cases-link"`
**And** the page contains a link to `/runs` marked `data-testid="runs-link"`
**And** requesting `/cases` with that session returns `200`
**And** requesting `/runs` with that session returns `200`

## Expected Result
The success page shows both browse links, and a logged-in user following either one lands
on a page that renders rather than a redirect or an error.

## Postconditions
- The session created by the case remains open; it is discarded when the server stops.

## Risk & Coverage
Not applicable — functional case, no threat model entry.

## Test Script
Implemented in `tests/scripts/TC-UI-006.test.js` — run with `npm test`.

```javascript
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { useServer, login, get } = require('./_harness');

const ctx = useServer();

test('TC-UI-006 — the success page links to the case and run browsers', async () => {
  const cookie = await login(ctx.base, 'admin', 'admin123');
  const success = await (await get(`${ctx.base}/success`, cookie)).text();

  assert.match(success, /<a href="\/cases"[^>]*data-testid="cases-link"/);
  assert.match(success, /<a href="\/runs"[^>]*data-testid="runs-link"/);
  assert.equal((await get(`${ctx.base}/cases`, cookie)).status, 200);
  assert.equal((await get(`${ctx.base}/runs`, cookie)).status, 200);
});
```

## Change Log
| Version | Date | Author | Change | Reason |
| --- | --- | --- | --- | --- |
| 1 | 2026-09-14 | marc.riegel@nimbusforge.de | Created | Issue #1 AC-2 requires the browse pages to be reachable from the success page |

## Notes
The link assertions match the `href` and the `data-testid` together, so moving the link
without its test hook - or keeping the hook on a link that points somewhere else - fails the
case. TC-SESS-011 covers what the same two routes do without a session.
