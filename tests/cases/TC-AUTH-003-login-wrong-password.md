---
id: TC-AUTH-003
title: Login is rejected for a known user with the wrong password
version: 3
status: approved
owner: marc.riegel@nimbusforge.de
created: 2026-09-14
updated: 2026-09-14
test_level: system
test_type: security
design_technique: equivalence-partitioning
priority: critical
suite: security
frequency: per-commit
automation: automated
script: tests/scripts/TC-AUTH-003.test.js
duration: 0.2s
environment: local-dev
last_reviewed: 2026-09-14
review_interval: 3m
stability: stable
references:
  - id: BSI-P-11
    type: bsi-practice
    source: BSI-Standard 200-3 §7 — Suitability of security safeguards
    demand: All aspects of the relevant threat must be covered in full, and the counteraction must match the security objective.
  - id: BSI-P-13
    type: bsi-practice
    source: BSI-Standard 200-3 §7 — User friendliness of security safeguards
    demand: It must not be too easy for users to circumvent the safeguard, and it must be clear when it has acted.
---

# TC-AUTH-003 — Login is rejected for a known user with the wrong password

## Objective
Prove that knowing a valid username is not sufficient to authenticate: the password is
actually checked, and a failed check grants no session.

## References
| Reference | Type | Source | What it demands |
| --- | --- | --- | --- |
| `BSI-P-11` | BSI practice | 200-3 §7 — Suitability | All aspects of the threat covered in full; counteraction matches the security objective |
| `BSI-P-13` | BSI practice | 200-3 §7 — User friendliness | The safeguard must not be easy to circumvent, and its action must be visible to the user |

No ticket exists for this behaviour, so the test basis is the BSI practice set. If an
acceptance criterion is later written for the login, add it here and keep the BSI
references only for what the AC does not state.

## Preconditions
- The application is running at `http://localhost:3000`.
- The client holds no `sid` session cookie.
- The account `admin` exists in the static credential list at `server.js:9`.

## Test Data
| Field | Value |
| --- | --- |
| Username | `admin` |
| Password | `wrongpassword` |
| Endpoint | `POST /login` (`application/x-www-form-urlencoded`) |

## Scenario

**Given** the client holds no `sid` session cookie
**And** the user has entered the valid username `admin`
**And** the user has entered the invalid password `wrongpassword`
**When** the user submits the login form
**Then** the response status is `401`
**And** the login form is redisplayed
**And** the element with `data-testid="error-message"` reads `Invalid username or password.`
**And** no `sid` session cookie is set
**And** the response does not redirect to `/success`

## Expected Result
Access is denied. The user stays on the login page, sees a generic error, and receives no
session of any kind.

## Postconditions
- No session is created server-side; the in-memory session map is unchanged.
- The client holds no `sid` cookie.

## Risk & Coverage
| Field | Value |
| --- | --- |
| Core value (BSI-P-01) | Confidentiality, Integrity |
| Elementary threat (BSI-P-02) | G 0.23 Unauthorised entry into IT systems; G 0.36 Identity theft |
| Frequency of occurrence (BSI-P-06) | `very-frequently` — credential guessing against an exposed login is continuous |
| Extent of damage (BSI-P-06) | `considerable` — an attacker gains an authenticated session |
| Risk category (BSI-P-07) | `very-high` (considerable × very-frequently) |
| Treatment option (BSI-P-08) | B — Risk reduction: the password check is the safeguard |
| Residual risk | The application has no rate limiting, so this case proves a single guess is refused but not that guessing at volume is. Accepted for a demo app; a real system needs a throttling case. |

## Test Script
Implemented in `tests/scripts/TC-AUTH-003.test.js` — run with `npm test`.

```javascript
'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const app = require('../../server');

let server;
let base;

before(async () => {
  server = app.listen(0);
  await once(server, 'listening');
  base = `http://localhost:${server.address().port}`;
});

after(() => server.close());

test('TC-AUTH-003 — a known user with the wrong password is rejected', async () => {
  const response = await fetch(`${base}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ username: 'admin', password: 'wrongpassword' }),
    redirect: 'manual',
  });
  const body = await response.text();

  // Then the response status is 401
  assert.equal(response.status, 401);

  // And the login form is redisplayed
  assert.match(body, /data-testid="login-form"/);

  // And data-testid="error-message" reads 'Invalid username or password.'
  const error = body.match(/data-testid="error-message"[^>]*>([^<]*)</);
  assert.ok(error, 'no element with data-testid="error-message" in the response');
  assert.equal(error[1].trim(), 'Invalid username or password.');

  // And no sid session cookie is set
  const cookies = response.headers.getSetCookie();
  assert.ok(
    !cookies.some((c) => c.startsWith('sid=')),
    `expected no sid cookie, got ${JSON.stringify(cookies)}`
  );

  // And the user is not redirected to /success
  assert.equal(response.headers.get('location'), null);
  assert.doesNotMatch(body, /Login successful/);
});
```

## Change Log
| Version | Date | Author | Change | Reason |
| --- | --- | --- | --- | --- |
| 3 | 2026-09-14 | marc.riegel@nimbusforge.de | Moved the server bootstrap into `tests/scripts/_harness.js` | Thirty-six scripts were each re-implementing the same setup; BSI-P-14 treats disproportionate test effort as a defect in its own right |
| 2 | 2026-09-14 | marc.riegel@nimbusforge.de | Migrated to the ISTQB case format; added the risk block, the automated script and this log | The `write-test-case` skill made traceability, risk classification and an executable script mandatory |
| 1 | 2026-09-14 | marc.riegel@nimbusforge.de | Created | Core negative path of the login: a valid username with a wrong password must be refused |

## Notes
Sibling cases required by BSI-P-11 for full coverage of the same safeguard: TC-AUTH-001
(valid credentials succeed), TC-AUTH-004 (unknown username), TC-AUTH-005 to TC-AUTH-007
(missing input), TC-SEC-002 (the error message does not distinguish this case from an
unknown username).

The generic error text is deliberate — see TC-SEC-002. A change that made this message more
specific would still pass this case, which is why TC-SEC-002 exists separately.

Verified to fail when the password comparison at `server.js:41` is removed.
