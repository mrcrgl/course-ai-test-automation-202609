---
id: TC-AUTH-005
title: Login is rejected when both fields are empty
version: 2
status: approved
owner: marc.riegel@nimbusforge.de
created: 2026-09-14
updated: 2026-09-14
test_level: system
test_type: functional
design_technique: boundary-value-analysis
priority: medium
suite: regression
frequency: per-commit
automation: automated
script: tests/scripts/TC-AUTH-005.test.js
duration: 0.1s
environment: local-dev
last_reviewed: 2026-09-14
review_interval: 6m
stability: stable
references:
  - id: BSI-P-13
    type: bsi-practice
    source: BSI-Standard 200-3 §7 — User friendliness of security safeguards
    demand: Safeguards must be tolerant towards user and operating errors, and it must be clear to the user when one has acted.
---

# TC-AUTH-005 — Login is rejected when both fields are empty

## Objective
Prove that incomplete input is refused as a bad request before any credential comparison
happens, and that the user is told what to fix.

## References
| Reference | Type | Source | What it demands |
| --- | --- | --- | --- |
| `BSI-P-13` | BSI practice | 200-3 §7 — User friendliness | Tolerance of user error; the user can tell the safeguard acted |

## Preconditions
- The application is running at `http://localhost:3000`.
- The client holds no `sid` session cookie.

## Test Data
| Field | Value |
| --- | --- |
| Username | *(empty)* |
| Password | *(empty)* |

## Scenario

**Given** the client holds no `sid` session cookie
**And** both the username and the password field are empty
**When** the user submits the login form
**Then** the response status is `400`
**And** the element with `data-testid="error-message"` reads `Username and password are required.`
**And** no `sid` session cookie is set

## Expected Result
The submission is rejected as incomplete, with a message naming what is missing. The
status distinguishes missing input (`400`) from rejected credentials (`401`).

## Postconditions
- No session is created; the in-memory session map is unchanged.

## Risk & Coverage
Not applicable — functional case, no threat model entry.

## Test Script
Implemented in `tests/scripts/TC-AUTH-005.test.js` — run with `npm test`.

```javascript
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { useServer, form, json, login, testid, inputValue } = require('./_harness');

const ctx = useServer();

test('TC-AUTH-005 — an empty form is rejected as missing input', async () => {
  const res = await fetch(`${ctx.base}/login`, form({ username: '', password: '' }));
  const body = await res.text();

  assert.equal(res.status, 400);
  assert.equal(testid(body, 'error-message'), 'Username and password are required.');
  assert.equal(res.headers.getSetCookie().filter((c) => c.startsWith('sid=')).length, 0);
});
```

## Change Log
| Version | Date | Author | Change | Reason |
| --- | --- | --- | --- | --- |
| 2 | 2026-09-14 | marc.riegel@nimbusforge.de | Migrated to the ISTQB case format and automated | The `write-test-case` skill requires traceability, recurrence metadata and an executable script |
| 1 | 2026-09-14 | marc.riegel@nimbusforge.de | Created | An empty form submission must be refused as incomplete rather than compared |

## Notes
The distinct `400` is the point of this case — a `401` here would mean the application
treated missing input as a failed credential check. TC-AUTH-005 to TC-AUTH-007 partition the
three ways input can be incomplete; all three must stay in step.
