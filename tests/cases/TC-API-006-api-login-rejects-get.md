---
id: TC-API-006
title: The API login endpoint is not exposed over GET
version: 1
status: approved
owner: marc.riegel@nimbusforge.de
created: 2026-09-14
updated: 2026-09-14
test_level: integration
test_type: security
design_technique: error-guessing
priority: medium
suite: security
frequency: per-commit
automation: automated
script: tests/scripts/TC-API-006.test.js
duration: 0.1s
environment: local-dev
last_reviewed: 2026-09-14
review_interval: 3m
stability: stable
references:
  - id: BSI-P-13
    type: bsi-practice
    source: BSI-Standard 200-3 §7 — User friendliness of security safeguards
    demand: It must not be too easy for users to circumvent the safeguard.
---

# TC-API-006 — The API login endpoint is not exposed over GET

## Objective
Prove credentials cannot be submitted in a URL, where they would land in browser history,
proxy logs and `Referer` headers.

## References
| Reference | Type | Source | What it demands |
| --- | --- | --- | --- |
| `BSI-P-13` | BSI practice | 200-3 §7 — User friendliness | The safeguard must not be easy to circumvent |

## Preconditions
- The application is running at `http://localhost:3000`.

## Test Data
| Field | Value |
| --- | --- |
| Endpoint | `GET /api/login?username=admin&password=admin123` |

## Scenario

**Given** the application is running
**When** the client sends valid credentials as query parameters via `GET /api/login`
**Then** the response status is not `200`
**And** the response status is `404`
**And** the response sets no cookies
**And** the response body does not report a successful authentication

## Expected Result
Credentials in a URL authenticate nothing. Only `POST` reaches the endpoint.

## Postconditions
- None — the case makes no state change.

## Risk & Coverage
| Field | Value |
| --- | --- |
| Core value (BSI-P-01) | Confidentiality |
| Elementary threat (BSI-P-02) | G 0.19 Disclosure of information that should be protected; G 0.45 Loss of data |
| Frequency of occurrence (BSI-P-06) | `medium` — clients take the shortcut whenever a server permits it |
| Extent of damage (BSI-P-06) | `considerable` — credentials persisted in logs and history outlive any session |
| Risk category (BSI-P-07) | `high` (considerable × medium) |
| Treatment option (BSI-P-08) | A — Risk avoidance: only `app.post` is registered for this path |
| Residual risk | The HTML form posts, and `GET /login` merely redirects, so no credential-bearing GET exists anywhere. This holds only while no GET route is added. |

## Test Script
Implemented in `tests/scripts/TC-API-006.test.js` — run with `npm test`.

```javascript
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { useServer, form, json, login, testid, inputValue } = require('./_harness');

const ctx = useServer();

test('TC-API-006 — the API login endpoint is not exposed over GET', async () => {
  const res = await fetch(`${ctx.base}/api/login?username=admin&password=admin123`, {
    redirect: 'manual',
  });

  assert.notEqual(res.status, 200);
  assert.equal(res.status, 404);
  assert.deepEqual(res.headers.getSetCookie(), []);
  assert.doesNotMatch(await res.text(), /"ok":\s*true/);
});
```

## Change Log
| Version | Date | Author | Change | Reason |
| --- | --- | --- | --- | --- |
| 1 | 2026-09-14 | marc.riegel@nimbusforge.de | Created | Gap found during the review of the legacy case set: no case covered credential submission over GET |

## Notes
Priority set to `medium` against the matrix's `high`, justified per BSI-P-07: Express does
not fall back from `POST` to `GET`, so the 404 comes from routing rather than from any
defence this application implements. The case is a regression pin on that routing, not
evidence of a safeguard.

The first assertion is deliberately `notEqual(200)` rather than only `equal(404)`. The
requirement is "this must not authenticate"; the exact status is secondary and could
legitimately become `405`.
