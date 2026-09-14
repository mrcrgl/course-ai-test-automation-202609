---
id: TC-AUTH-011
title: The username survives a failed attempt but the password does not
version: 2
status: approved
owner: marc.riegel@nimbusforge.de
created: 2026-09-14
updated: 2026-09-14
test_level: system
test_type: usability
design_technique: use-case
priority: medium
suite: regression
frequency: per-commit
automation: automated
script: tests/scripts/TC-AUTH-011.test.js
duration: 0.1s
environment: local-dev
last_reviewed: 2026-09-14
review_interval: 6m
stability: stable
references:
  - id: BSI-P-13
    type: bsi-practice
    source: BSI-Standard 200-3 §7 — User friendliness of security safeguards
    demand: Safeguards must be tolerant towards user errors; solutions that hinder the parties concerned as little as possible should be found.
---

# TC-AUTH-011 — The username survives a failed attempt but the password does not

## Objective
Prove a rejected login costs the user only the password: the username is redisplayed, while
the password is never written back into the page.

## References
| Reference | Type | Source | What it demands |
| --- | --- | --- | --- |
| `BSI-P-13` | BSI practice | 200-3 §7 — User friendliness | Tolerance of user error; hinder the user as little as possible |

## Preconditions
- The application is running at `http://localhost:3000`.
- The client holds no `sid` session cookie.

## Test Data
| Field | Value |
| --- | --- |
| Username | `tester` |
| Password | `wrongpassword` |

## Scenario

**Given** the client holds no `sid` session cookie
**And** the user has entered the username `tester`
**And** the user has entered the wrong password `wrongpassword`
**When** the user submits the login form
**Then** the response status is `401`
**And** the input with `data-testid="username-input"` carries the value `tester`
**And** the input with `data-testid="password-input"` carries no `value` attribute
**And** an error message is displayed

## Expected Result
The username is preserved for the retry; the password field comes back empty.

## Postconditions
- No session is created; the in-memory session map is unchanged.

## Risk & Coverage
Not applicable — usability case. That the password never appears anywhere in a response is
asserted as a security property by TC-SEC-004.

## Test Script
Implemented in `tests/scripts/TC-AUTH-011.test.js` — run with `npm test`.

```javascript
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { useServer, form, json, login, testid, inputValue } = require('./_harness');

const ctx = useServer();

test('TC-AUTH-011 — the username survives a failed attempt but the password does not', async () => {
  const res = await fetch(`${ctx.base}/login`, form({ username: 'tester', password: 'wrongpassword' }));
  const body = await res.text();

  assert.equal(res.status, 401);
  assert.equal(inputValue(body, 'username-input'), 'tester');
  assert.equal(inputValue(body, 'password-input'), null, 'the password input carries a value attribute');
  assert.ok(testid(body, 'error-message'), 'no error message shown');
});
```

## Change Log
| Version | Date | Author | Change | Reason |
| --- | --- | --- | --- | --- |
| 2 | 2026-09-14 | marc.riegel@nimbusforge.de | Migrated to the ISTQB case format and automated | The `write-test-case` skill requires traceability, recurrence metadata and an executable script |
| 1 | 2026-09-14 | marc.riegel@nimbusforge.de | Created | A failed login should not force the user to retype everything |

## Notes
`renderLogin` injects the username by replacing the literal string `value=""` in the
template. That replacement hits the first match, which is the username input — the password
input has no `value` attribute at all. The third assertion pins that: if a `value=""` were
ever added to the password input above the username input, the password would be echoed
into the page instead.
