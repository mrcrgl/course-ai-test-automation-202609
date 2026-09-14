---
id: TC-SESS-003
title: Logout clears the cookie and returns to the login page
version: 2
status: approved
owner: marc.riegel@nimbusforge.de
created: 2026-09-14
updated: 2026-09-14
test_level: system
test_type: functional
design_technique: state-transition
priority: high
suite: regression
frequency: per-commit
automation: automated
script: tests/scripts/TC-SESS-003.test.js
duration: 0.1s
environment: local-dev
last_reviewed: 2026-09-14
review_interval: 6m
stability: stable
references:
  - id: BSI-P-13
    type: bsi-practice
    source: BSI-Standard 200-3 §7 — User friendliness of security safeguards
    demand: It must be clear to the user when a safeguard has acted.
---

# TC-SESS-003 — Logout clears the cookie and returns to the login page

## Objective
Prove the logout control does what it says on the client side: the cookie is cleared and
the user is visibly returned to the login page.

## References
| Reference | Type | Source | What it demands |
| --- | --- | --- | --- |
| `BSI-P-13` | BSI practice | 200-3 §7 — User friendliness | The user can tell the safeguard acted |

## Preconditions
- The application is running at `http://localhost:3000`.
- The client holds a valid `sid` cookie from logging in as `admin`.

## Test Data
| Field | Value |
| --- | --- |
| Endpoint | `POST /logout` |
| Control | the button with `data-testid="logout-button"` |

## Scenario

**Given** the user is logged in as `admin` and is on the success page
**When** the user submits the logout form
**Then** the response status is `302` with `Location: /`
**And** the response carries a `Set-Cookie` header that clears `sid`
**And** following the redirect displays the login form

## Expected Result
The user is logged out and lands back on the login page with no session cookie.

## Postconditions
- The client no longer holds a usable `sid` cookie.
- The server-side session is destroyed — asserted separately by TC-SESS-004.

## Risk & Coverage
Not applicable — functional case. The security-critical half of logout, that the server
stops honouring the old identifier, is TC-SESS-004.

## Test Script
Implemented in `tests/scripts/TC-SESS-003.test.js` — run with `npm test`.

```javascript
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { useServer, form, json, login, testid, inputValue } = require('./_harness');

const ctx = useServer();

test('TC-SESS-003 — logout clears the cookie and returns to the login page', async () => {
  const sid = await login(ctx.base, 'admin', 'admin123');
  const res = await fetch(`${ctx.base}/logout`, {
    method: 'POST',
    headers: { cookie: sid },
    redirect: 'manual',
  });

  assert.equal(res.status, 302);
  assert.equal(res.headers.get('location'), '/');

  const cleared = res.headers.getSetCookie().find((c) => c.startsWith('sid='));
  assert.ok(cleared, 'no Set-Cookie header clearing sid');
  assert.match(cleared, /sid=;/);

  const page = await fetch(`${ctx.base}/`, { redirect: 'manual' });
  assert.match(await page.text(), /data-testid="login-form"/);
});
```

## Change Log
| Version | Date | Author | Change | Reason |
| --- | --- | --- | --- | --- |
| 2 | 2026-09-14 | marc.riegel@nimbusforge.de | Migrated to the ISTQB case format and automated | The `write-test-case` skill requires traceability, recurrence metadata and an executable script |
| 1 | 2026-09-14 | marc.riegel@nimbusforge.de | Created | The logout control must visibly end the session |

## Notes
Deliberately split from TC-SESS-004. This case checks the client is *told* to drop the
cookie; TC-SESS-004 checks the server stopped honouring it. An implementation that only
cleared the cookie would pass here and fail there — which is the whole point of keeping
them apart.
