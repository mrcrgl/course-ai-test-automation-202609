---
id: TC-SESS-001
title: The success page is unreachable without a session
version: 2
status: approved
owner: marc.riegel@nimbusforge.de
created: 2026-09-14
updated: 2026-09-14
test_level: system
test_type: security
design_technique: use-case
priority: critical
suite: security
frequency: per-commit
automation: automated
script: tests/scripts/TC-SESS-001.test.js
duration: 0.1s
environment: local-dev
last_reviewed: 2026-09-14
review_interval: 3m
stability: stable
references:
  - id: BSI-P-11
    type: bsi-practice
    source: BSI-Standard 200-3 §7 — Suitability of security safeguards
    demand: All aspects of the relevant threat must be covered in full, and the counteraction must match the security objective.
---

# TC-SESS-001 — The success page is unreachable without a session

## Objective
Prove the protected page is guarded by the session check and not merely by the fact that
the login flow happens to link to it.

## References
| Reference | Type | Source | What it demands |
| --- | --- | --- | --- |
| `BSI-P-11` | BSI practice | 200-3 §7 — Suitability | All aspects of the threat covered in full; counteraction matches the objective |

## Preconditions
- The application is running at `http://localhost:3000`.
- The client has never logged in and holds no `sid` session cookie.

## Test Data
| Field | Value |
| --- | --- |
| Endpoint | `GET /success` |

## Scenario

**Given** the client has never logged in and holds no `sid` session cookie
**When** the client requests `GET /success` directly
**Then** the response status is `302` with `Location: /`
**And** the response body does not contain `Login successful`
**And** following the redirect displays the login form

## Expected Result
An unauthenticated visitor is sent back to the login page and sees none of the protected
content.

## Postconditions
- None — the case makes no state change.

## Risk & Coverage
| Field | Value |
| --- | --- |
| Core value (BSI-P-01) | Confidentiality |
| Elementary threat (BSI-P-02) | G 0.30 Unauthorised use or administration of devices and systems; G 0.32 Misuse of authorisations |
| Frequency of occurrence (BSI-P-06) | `very-frequently` — requesting a known protected URL directly is the first thing any scanner tries |
| Extent of damage (BSI-P-06) | `considerable` — full access to protected content with no credential at all |
| Risk category (BSI-P-07) | `very-high` (considerable × very-frequently) |
| Treatment option (BSI-P-08) | B — Risk reduction: the `currentUser` guard at `server.js:50` is the safeguard |
| Residual risk | The application has exactly one protected page. A second one added without the same guard would not be caught by this case. |

## Test Script
Implemented in `tests/scripts/TC-SESS-001.test.js` — run with `npm test`.

```javascript
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { useServer, form, json, login, testid, inputValue } = require('./_harness');

const ctx = useServer();

test('TC-SESS-001 — the success page is unreachable without a session', async () => {
  const res = await fetch(`${ctx.base}/success`, { redirect: 'manual' });
  const body = await res.text();

  assert.equal(res.status, 302);
  assert.equal(res.headers.get('location'), '/');
  assert.doesNotMatch(body, /Login successful/);

  const followed = await fetch(`${ctx.base}/`, { redirect: 'manual' });
  assert.match(await followed.text(), /data-testid="login-form"/);
});
```

## Change Log
| Version | Date | Author | Change | Reason |
| --- | --- | --- | --- | --- |
| 2 | 2026-09-14 | marc.riegel@nimbusforge.de | Migrated to the ISTQB case format and automated | The `write-test-case` skill requires traceability, risk classification and an executable script |
| 1 | 2026-09-14 | marc.riegel@nimbusforge.de | Created | Primary access-control check; a 200 here is a critical defect |

## Notes
The body assertion is not redundant with the status assertion. A redirect that still carried
the protected content in its body would pass a status-only check while leaking everything.

Verified to fail when the `currentUser` guard at `server.js:50` is removed.
