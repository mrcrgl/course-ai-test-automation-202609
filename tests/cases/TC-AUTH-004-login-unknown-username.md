---
id: TC-AUTH-004
title: Login is rejected for an unknown username
version: 2
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
script: tests/scripts/TC-AUTH-004.test.js
duration: 0.1s
environment: local-dev
last_reviewed: 2026-09-14
review_interval: 3m
stability: stable
references:
  - id: BSI-P-11
    type: bsi-practice
    source: BSI-Standard 200-3 §7 — Suitability of security safeguards
    demand: All aspects of the relevant threat must be covered in full.
---

# TC-AUTH-004 — Login is rejected for an unknown username

## Objective
Prove that an account absent from the credential list cannot authenticate, whatever
password is supplied.

## References
| Reference | Type | Source | What it demands |
| --- | --- | --- | --- |
| `BSI-P-11` | BSI practice | 200-3 §7 — Suitability | All aspects of the threat covered in full |

## Preconditions
- The application is running at `http://localhost:3000`.
- The client holds no `sid` session cookie.
- No account named `nobody` exists at `server.js:9`.

## Test Data
| Field | Value |
| --- | --- |
| Username | `nobody` |
| Password | `anything` |

## Scenario

**Given** the client holds no `sid` session cookie
**And** the username `nobody` is not a configured account
**When** the user submits the login form with `nobody` / `anything`
**Then** the response status is `401`
**And** the element with `data-testid="error-message"` reads `Invalid username or password.`
**And** no `sid` session cookie is set
**And** the response carries no `Location` header

## Expected Result
Access is denied with exactly the same message a wrong password produces.

## Postconditions
- No session is created; the in-memory session map is unchanged.

## Risk & Coverage
| Field | Value |
| --- | --- |
| Core value (BSI-P-01) | Confidentiality, Integrity |
| Elementary threat (BSI-P-02) | G 0.23 Unauthorised entry into IT systems |
| Frequency of occurrence (BSI-P-06) | `very-frequently` — username guessing accompanies every credential attack |
| Extent of damage (BSI-P-06) | `considerable` — a hit would yield an authenticated session |
| Risk category (BSI-P-07) | `very-high` (considerable × very-frequently) |
| Treatment option (BSI-P-08) | B — Risk reduction: lookup against the credential map is the safeguard |
| Residual risk | As TC-AUTH-003: no rate limiting, so volume guessing is unaddressed. |

## Test Script
Implemented in `tests/scripts/TC-AUTH-004.test.js` — run with `npm test`.

```javascript
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { useServer, form, json, login, testid, inputValue } = require('./_harness');

const ctx = useServer();

test('TC-AUTH-004 — an unknown username is rejected', async () => {
  const res = await fetch(`${ctx.base}/login`, form({ username: 'nobody', password: 'anything' }));
  const body = await res.text();

  assert.equal(res.status, 401);
  assert.equal(testid(body, 'error-message'), 'Invalid username or password.');
  assert.equal(res.headers.getSetCookie().filter((c) => c.startsWith('sid=')).length, 0);
  assert.equal(res.headers.get('location'), null);
});
```

## Change Log
| Version | Date | Author | Change | Reason |
| --- | --- | --- | --- | --- |
| 2 | 2026-09-14 | marc.riegel@nimbusforge.de | Migrated to the ISTQB case format and automated | The `write-test-case` skill requires traceability, risk classification and an executable script |
| 1 | 2026-09-14 | marc.riegel@nimbusforge.de | Created | An unknown account must not authenticate |

## Notes
That the message matches TC-AUTH-003's byte for byte is asserted in TC-SEC-002, not here.
This case only requires that the message is the generic one.

`USERS[username]` returns `undefined` for an unknown account, so the comparison against the
submitted password can never match. The case guards the day someone replaces that lookup
with something looser.
