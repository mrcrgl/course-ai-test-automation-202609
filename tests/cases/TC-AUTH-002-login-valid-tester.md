---
id: TC-AUTH-002
title: The second account logs in and is named on the success page
version: 2
status: approved
owner: marc.riegel@nimbusforge.de
created: 2026-09-14
updated: 2026-09-14
test_level: system
test_type: functional
design_technique: equivalence-partitioning
priority: high
suite: regression
frequency: per-commit
automation: automated
script: tests/scripts/TC-AUTH-002.test.js
duration: 0.1s
environment: local-dev
last_reviewed: 2026-09-14
review_interval: 6m
stability: stable
references:
  - id: LOGIN-SUCCESS
    type: derived
    source: server.js:32 (POST /login) and server.js:85 (successPage)
    demand: The success page names the account that authenticated, not a fixed name.
---

# TC-AUTH-002 — The second account logs in and is named on the success page

## Objective
Prove authentication is not wired to a single account, and that the success page reflects
whoever actually logged in.

## References
| Reference | Type | Source | What it demands |
| --- | --- | --- | --- |
| `LOGIN-SUCCESS` | Derived | `server.js:32`, `server.js:85` | The success page names the account that authenticated, not a fixed name |

## Preconditions
- The application is running at `http://localhost:3000`.
- The client holds no `sid` session cookie.
- The account `tester` exists in the static credential list at `server.js:9`.

## Test Data
| Field | Value |
| --- | --- |
| Username | `tester` |
| Password | `test123` |

## Scenario

**Given** the client holds no `sid` session cookie
**When** the user logs in as `tester` with the password `test123`
**Then** a `sid` session cookie is issued
**And** the element with `data-testid="username"` on the success page reads `tester`
**And** that element does not read `admin`

## Expected Result
The `tester` account authenticates and the success page greets `tester`.

## Postconditions
- A session exists for `tester`; the client holds the matching `sid` cookie.

## Risk & Coverage
Not applicable — functional case, no threat model entry.

## Test Script
Implemented in `tests/scripts/TC-AUTH-002.test.js` — run with `npm test`.

```javascript
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { useServer, form, json, login, testid, inputValue } = require('./_harness');

const ctx = useServer();

test('TC-AUTH-002 — the second account logs in and is named on the success page', async () => {
  const sid = await login(ctx.base, 'tester', 'test123');
  assert.ok(sid, 'no sid cookie was issued');

  const body = await (await fetch(`${ctx.base}/success`, { headers: { cookie: sid } })).text();

  assert.equal(testid(body, 'username'), 'tester');
  assert.notEqual(testid(body, 'username'), 'admin');
});
```

## Change Log
| Version | Date | Author | Change | Reason |
| --- | --- | --- | --- | --- |
| 2 | 2026-09-14 | marc.riegel@nimbusforge.de | Migrated to the ISTQB case format and automated | The `write-test-case` skill requires traceability, recurrence metadata and an executable script |
| 1 | 2026-09-14 | marc.riegel@nimbusforge.de | Created | Catches a hard-coded username on the success page |

## Notes
The final assertion — that the page does *not* say `admin` — is the point of the case.
Without it, a `successPage` that ignored its argument and always printed `admin` would
still pass TC-AUTH-001.
