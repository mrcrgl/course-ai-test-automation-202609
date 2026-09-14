---
id: TC-SESS-002
title: A logged-in user is redirected away from the login page
version: 2
status: approved
owner: marc.riegel@nimbusforge.de
created: 2026-09-14
updated: 2026-09-14
test_level: system
test_type: functional
design_technique: state-transition
priority: medium
suite: regression
frequency: per-commit
automation: automated
script: tests/scripts/TC-SESS-002.test.js
duration: 0.1s
environment: local-dev
last_reviewed: 2026-09-14
review_interval: 6m
stability: stable
references:
  - id: BSI-P-13
    type: bsi-practice
    source: BSI-Standard 200-3 §7 — User friendliness of security safeguards
    demand: It must be clear to the user what state a safeguard has put them in.
---

# TC-SESS-002 — A logged-in user is redirected away from the login page

## Objective
Prove the application does not offer a login form to someone who is already authenticated,
so the session state is never ambiguous to the user.

## References
| Reference | Type | Source | What it demands |
| --- | --- | --- | --- |
| `BSI-P-13` | BSI practice | 200-3 §7 — User friendliness | The user can tell what state the safeguard has put them in |

## Preconditions
- The application is running at `http://localhost:3000`.
- The client holds a valid `sid` cookie from logging in as `admin`.

## Test Data
| Field | Value |
| --- | --- |
| Endpoint | `GET /` |
| Session | `admin`, logged in |

## Scenario

**Given** the user has successfully logged in as `admin`
**When** the user navigates to `/`
**Then** the response status is `302` with `Location: /success`
**And** the login form is not present in the response body

## Expected Result
An already-authenticated user cannot land back on the login form.

## Postconditions
- The session is unchanged and still valid.

## Risk & Coverage
Not applicable — functional case. The access-control direction of this guard is
TC-SESS-001.

## Test Script
Implemented in `tests/scripts/TC-SESS-002.test.js` — run with `npm test`.

```javascript
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { useServer, form, json, login, testid, inputValue } = require('./_harness');

const ctx = useServer();

test('TC-SESS-002 — a logged-in user is redirected away from the login page', async () => {
  const sid = await login(ctx.base, 'admin', 'admin123');
  const res = await fetch(`${ctx.base}/`, { headers: { cookie: sid }, redirect: 'manual' });

  assert.equal(res.status, 302);
  assert.equal(res.headers.get('location'), '/success');
  assert.doesNotMatch(await res.text(), /data-testid="login-form"/);
});
```

## Change Log
| Version | Date | Author | Change | Reason |
| --- | --- | --- | --- | --- |
| 2 | 2026-09-14 | marc.riegel@nimbusforge.de | Migrated to the ISTQB case format and automated | The `write-test-case` skill requires traceability, recurrence metadata and an executable script |
| 1 | 2026-09-14 | marc.riegel@nimbusforge.de | Created | A logged-in user should not be shown a login form |

## Notes
The same `currentUser` helper drives this redirect and the TC-SESS-001 guard, so the two
cases exercise it from both directions — the interaction check BSI-P-12 asks for.
