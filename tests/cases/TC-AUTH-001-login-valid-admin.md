---
id: TC-AUTH-001
title: Valid admin credentials authenticate and reach the success page
version: 2
status: approved
owner: marc.riegel@nimbusforge.de
created: 2026-09-14
updated: 2026-09-14
test_level: system
test_type: functional
design_technique: equivalence-partitioning
priority: critical
suite: smoke
frequency: per-commit
automation: automated
script: tests/scripts/TC-AUTH-001.test.js
duration: 0.1s
environment: local-dev
last_reviewed: 2026-09-14
review_interval: 6m
stability: stable
references:
  - id: LOGIN-SUCCESS
    type: derived
    source: server.js:32 (POST /login) and server.js:50 (GET /success)
    demand: Matching credentials establish a session and the success page is shown.
---

# TC-AUTH-001 — Valid admin credentials authenticate and reach the success page

## Objective
Prove the primary purpose of the application: correct credentials produce a session and the
success page, identifying the account that logged in.

## References
| Reference | Type | Source | What it demands |
| --- | --- | --- | --- |
| `LOGIN-SUCCESS` | Derived | `server.js:32`, `server.js:50` | Matching credentials establish a session and show the success page |

This is the behaviour most likely to have an acceptance criterion written for it. When a
ticket exists, replace this `derived` reference with the AC.

## Preconditions
- The application is running at `http://localhost:3000`.
- The client holds no `sid` session cookie.
- The account `admin` exists in the static credential list at `server.js:9`.

## Test Data
| Field | Value |
| --- | --- |
| Username | `admin` |
| Password | `admin123` |

## Scenario

**Given** the client holds no `sid` session cookie
**And** the user has entered the username `admin`
**And** the user has entered the password `admin123`
**When** the user submits the login form
**Then** the response status is `302` with `Location: /success`
**And** a `sid` session cookie is issued
**And** requesting `/success` with that cookie returns `200`
**And** the element with `data-testid="success-heading"` reads `Login successful`
**And** the element with `data-testid="username"` reads `admin`

## Expected Result
The user is authenticated and sees the success page naming them as `admin`.

## Postconditions
- A session exists server-side and the client holds the matching `sid` cookie.
- The session is discarded when the test server shuts down; no cleanup is needed.

## Risk & Coverage
Not applicable — functional case. The security properties of the session it creates are
covered by TC-SESS-006 and TC-SESS-008.

## Test Script
Implemented in `tests/scripts/TC-AUTH-001.test.js` — run with `npm test`.

```javascript
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { useServer, form, json, login, testid, inputValue } = require('./_harness');

const ctx = useServer();

test('TC-AUTH-001 — valid admin credentials authenticate and reach the success page', async () => {
  const res = await fetch(`${ctx.base}/login`, form({ username: 'admin', password: 'admin123' }));

  assert.equal(res.status, 302);
  assert.equal(res.headers.get('location'), '/success');

  const cookie = res.headers.getSetCookie().find((c) => c.startsWith('sid='));
  assert.ok(cookie, 'no sid cookie was issued');

  const success = await fetch(`${ctx.base}/success`, {
    headers: { cookie: cookie.split(';')[0] },
    redirect: 'manual',
  });
  const body = await success.text();

  assert.equal(success.status, 200);
  assert.equal(testid(body, 'success-heading'), 'Login successful');
  assert.equal(testid(body, 'username'), 'admin');
});
```

## Change Log
| Version | Date | Author | Change | Reason |
| --- | --- | --- | --- | --- |
| 2 | 2026-09-14 | marc.riegel@nimbusforge.de | Migrated to the ISTQB case format and automated | The `write-test-case` skill requires traceability, recurrence metadata and an executable script |
| 1 | 2026-09-14 | marc.riegel@nimbusforge.de | Created | The happy path is the primary acceptance criterion of the application |

## Notes
The positive half of the coverage BSI-P-11 demands for the credential check. The negative,
boundary and bypass halves are TC-AUTH-003 to TC-AUTH-011 and TC-SESS-005.
