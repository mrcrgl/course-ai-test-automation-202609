---
id: TC-API-005
title: A successful API login grants no session
version: 1
status: approved
owner: marc.riegel@nimbusforge.de
created: 2026-09-14
updated: 2026-09-14
test_level: integration
test_type: security
design_technique: use-case
priority: high
suite: security
frequency: per-commit
automation: automated
script: tests/scripts/TC-API-005.test.js
duration: 0.1s
environment: local-dev
last_reviewed: 2026-09-14
review_interval: 3m
stability: stable
references:
  - id: BSI-P-12
    type: bsi-practice
    source: BSI-Standard 200-3 §7 — Interaction of security safeguards
    demand: Safeguards must not conflict with each other; the combination must be an effective entity.
---

# TC-API-005 — A successful API login grants no session

## Objective
Prove the JSON endpoint only validates credentials. It must not be a second, unguarded way
to obtain a session that the HTML flow controls carefully.

## References
| Reference | Type | Source | What it demands |
| --- | --- | --- | --- |
| `BSI-P-12` | BSI practice | 200-3 §7 — Interaction | Safeguards must not conflict; the combination must be effective |

## Preconditions
- The application is running at `http://localhost:3000`.
- The client holds no `sid` session cookie.

## Test Data
| Field | Value |
| --- | --- |
| Body | `{"username":"admin","password":"admin123"}` |

## Scenario

**Given** the client holds no `sid` session cookie
**When** the client authenticates successfully via `POST /api/login`
**Then** the response status is `200`
**And** the response sets no cookies at all
**And** a subsequent `GET /success` still redirects to `/`

## Expected Result
The API confirms the credentials and nothing more. Session creation remains exclusive to
the form flow.

## Postconditions
- No session exists; the session map is unchanged.

## Risk & Coverage
| Field | Value |
| --- | --- |
| Core value (BSI-P-01) | Confidentiality, Integrity |
| Elementary threat (BSI-P-02) | G 0.30 Unauthorised use or administration of devices and systems; G 0.32 Misuse of authorisations |
| Frequency of occurrence (BSI-P-06) | `rarely` — requires a deliberate change to the endpoint to become exploitable |
| Extent of damage (BSI-P-06) | `considerable` — a session issued outside the controlled path would bypass the cookie hardening in TC-SESS-006 |
| Risk category (BSI-P-07) | `medium` (considerable × rarely) |
| Treatment option (BSI-P-08) | A — Risk avoidance: the endpoint simply has no session-creation code |
| Residual risk | None while the endpoint stays stateless. If it ever issues a token, this case must be rewritten rather than deleted. |

## Test Script
Implemented in `tests/scripts/TC-API-005.test.js` — run with `npm test`.

```javascript
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { useServer, form, json, login, testid, inputValue } = require('./_harness');

const ctx = useServer();

test('TC-API-005 — a successful API login grants no session', async () => {
  const res = await fetch(`${ctx.base}/api/login`, json({ username: 'admin', password: 'admin123' }));

  assert.equal(res.status, 200);
  assert.deepEqual(res.headers.getSetCookie(), [], 'the API issued a cookie');

  // Without a cookie the protected page must still be out of reach.
  const success = await fetch(`${ctx.base}/success`, { redirect: 'manual' });
  assert.equal(success.status, 302);
  assert.equal(success.headers.get('location'), '/');
});
```

## Change Log
| Version | Date | Author | Change | Reason |
| --- | --- | --- | --- | --- |
| 1 | 2026-09-14 | marc.riegel@nimbusforge.de | Created | Gap found during the review of the legacy case set: nothing asserted that the API is stateless, so it could start issuing sessions unnoticed |

## Notes
Priority raised from the matrix's `medium` to `high`. The likely way this breaks is someone
adding "convenience" session creation to the API without carrying over the cookie hardening
— a change that would look like a feature in review and that no other case would catch.

Treatment option A: the safeguard is the absence of session-creation code, so the case
asserts a capability is not present.
