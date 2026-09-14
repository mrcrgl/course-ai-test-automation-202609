---
id: TC-SEC-002
title: A wrong password and an unknown user are indistinguishable
version: 2
status: approved
owner: marc.riegel@nimbusforge.de
created: 2026-09-14
updated: 2026-09-14
test_level: system
test_type: security
design_technique: decision-table
priority: medium
suite: security
frequency: per-commit
automation: automated
script: tests/scripts/TC-SEC-002.test.js
duration: 0.1s
environment: local-dev
last_reviewed: 2026-09-14
review_interval: 3m
stability: stable
references:
  - id: BSI-P-11
    type: bsi-practice
    source: BSI-Standard 200-3 §7 — Suitability of security safeguards
    demand: The counteraction must match the security objective — denying access without disclosing which account exists.
---

# TC-SEC-002 — A wrong password and an unknown user are indistinguishable

## Objective
Prove the login does not disclose which usernames exist, so it cannot be used to enumerate
accounts before attacking them.

## References
| Reference | Type | Source | What it demands |
| --- | --- | --- | --- |
| `BSI-P-11` | BSI practice | 200-3 §7 — Suitability | The counteraction must match the security objective |

## Preconditions
- The application is running at `http://localhost:3000`.
- `admin` exists as an account; `nobody` does not.

## Test Data
| Field | Value |
| --- | --- |
| Attempt A | `admin` / `wrongpassword` (existing account) |
| Attempt B | `nobody` / `wrongpassword` (unknown account) |

## Scenario

**Given** the client holds no `sid` session cookie
**When** the user submits attempt A with an existing username and a wrong password
**And** the user submits attempt B with an unknown username and the same password
**Then** both responses have status `401`
**And** both statuses are equal to each other
**And** both display the error `Invalid username or password.`
**And** the two error messages are identical
**And** neither message says the account does not exist or that only the password was wrong

## Expected Result
The two failures are indistinguishable to the client.

## Postconditions
- No session is created; no state changes.

## Risk & Coverage
| Field | Value |
| --- | --- |
| Core value (BSI-P-01) | Confidentiality |
| Elementary threat (BSI-P-02) | G 0.19 Disclosure of information that should be protected; G 0.14 Espionage |
| Frequency of occurrence (BSI-P-06) | `frequently` — enumeration is a standard preliminary to credential attacks |
| Extent of damage (BSI-P-06) | `limited` — knowing an account exists aids an attack but is not itself access |
| Risk category (BSI-P-07) | `medium` (limited × frequently) |
| Treatment option (BSI-P-08) | B — Risk reduction: one shared error string for both failure modes, at `server.js:41` |
| Residual risk | Only the response *content* is compared. Timing is not measured; with a static credential map the difference is negligible, but a database-backed lookup would reintroduce a timing channel and need its own case. |

## Test Script
Implemented in `tests/scripts/TC-SEC-002.test.js` — run with `npm test`.

```javascript
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { useServer, form, json, login, testid, inputValue } = require('./_harness');

const ctx = useServer();

test('TC-SEC-002 — a wrong password and an unknown user are indistinguishable', async () => {
  const known = await fetch(`${ctx.base}/login`, form({ username: 'admin', password: 'wrongpassword' }));
  const unknown = await fetch(`${ctx.base}/login`, form({ username: 'nobody', password: 'wrongpassword' }));

  assert.equal(known.status, 401);
  assert.equal(unknown.status, 401);
  assert.equal(known.status, unknown.status);

  const knownError = testid(await known.text(), 'error-message');
  const unknownError = testid(await unknown.text(), 'error-message');

  assert.equal(knownError, 'Invalid username or password.');
  assert.equal(knownError, unknownError);
  assert.doesNotMatch(knownError, /exist|unknown|no such|password is/i);
});
```

## Change Log
| Version | Date | Author | Change | Reason |
| --- | --- | --- | --- | --- |
| 2 | 2026-09-14 | marc.riegel@nimbusforge.de | Migrated to the ISTQB case format; added an assertion comparing the two messages to each other | Asserting each message separately would still pass if both were changed together to something disclosing |
| 1 | 2026-09-14 | marc.riegel@nimbusforge.de | Created | The login must not reveal which usernames exist |

## Notes
This is the case TC-AUTH-003 and TC-AUTH-004 defer to. Each of those asserts its own error
text; only this one asserts the two are the *same*, which is the actual anti-enumeration
property.
