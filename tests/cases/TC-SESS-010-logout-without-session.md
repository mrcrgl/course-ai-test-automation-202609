---
id: TC-SESS-010
title: Logging out without a session is handled gracefully
version: 1
status: approved
owner: marc.riegel@nimbusforge.de
created: 2026-09-14
updated: 2026-09-14
test_level: system
test_type: reliability
design_technique: error-guessing
priority: low
suite: regression
frequency: per-commit
automation: automated
script: tests/scripts/TC-SESS-010.test.js
duration: 0.1s
environment: local-dev
last_reviewed: 2026-09-14
review_interval: 12m
stability: stable
references:
  - id: BSI-P-13
    type: bsi-practice
    source: BSI-Standard 200-3 §7 — User friendliness of security safeguards
    demand: Safeguards must be tolerant towards user and operating errors.
---

# TC-SESS-010 — Logging out without a session is handled gracefully

## Objective
Prove that logging out when there is nothing to log out of — a double submit, a stale tab,
an expired cookie — produces the normal redirect rather than an error.

## References
| Reference | Type | Source | What it demands |
| --- | --- | --- | --- |
| `BSI-P-13` | BSI practice | 200-3 §7 — User friendliness | Safeguards must tolerate user and operating errors |

## Preconditions
- The application is running at `http://localhost:3000`.
- The client holds no `sid` session cookie.

## Test Data
| Field | Value |
| --- | --- |
| Endpoint | `POST /logout` with no cookie |

## Scenario

**Given** the client holds no `sid` session cookie
**When** the client submits `POST /logout`
**Then** the response status is `302` with `Location: /`
**And** the response status is not a `5xx`

## Expected Result
Logging out with no session behaves exactly like logging out with one: a redirect to the
login page, no error.

## Postconditions
- None — there was no session to destroy.

## Risk & Coverage
Not applicable — reliability case. No threat model entry: the failure mode is an
unhandled error, not a security bypass.

## Test Script
Implemented in `tests/scripts/TC-SESS-010.test.js` — run with `npm test`.

```javascript
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { useServer, form, json, login, testid, inputValue } = require('./_harness');

const ctx = useServer();

test('TC-SESS-010 — logging out without a session is handled gracefully', async () => {
  const res = await fetch(`${ctx.base}/logout`, { method: 'POST', redirect: 'manual' });

  assert.equal(res.status, 302);
  assert.equal(res.headers.get('location'), '/');
  assert.ok(res.status < 500, 'logout without a session must not raise a server error');
});
```

## Change Log
| Version | Date | Author | Change | Reason |
| --- | --- | --- | --- | --- |
| 1 | 2026-09-14 | marc.riegel@nimbusforge.de | Created | Gap found during the review of the legacy case set: every logout case assumed a session already existed |

## Notes
`sessions.delete(undefined)` is a no-op on a `Map`, and `res.clearCookie` does not care
whether the cookie was there. The behaviour is correct by accident rather than by design,
which is exactly the kind of thing that breaks when the session store is replaced with
something less forgiving.
