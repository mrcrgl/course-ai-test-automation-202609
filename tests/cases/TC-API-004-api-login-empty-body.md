---
id: TC-API-004
title: The API handles an empty or absent body without failing
version: 2
status: approved
owner: marc.riegel@nimbusforge.de
created: 2026-09-14
updated: 2026-09-14
test_level: integration
test_type: reliability
design_technique: error-guessing
priority: medium
suite: regression
frequency: per-commit
automation: automated
script: tests/scripts/TC-API-004.test.js
duration: 0.1s
environment: local-dev
last_reviewed: 2026-09-14
review_interval: 6m
stability: stable
references:
  - id: BSI-P-13
    type: bsi-practice
    source: BSI-Standard 200-3 §7 — User friendliness of security safeguards
    demand: Safeguards must be tolerant towards user and operating errors.
---

# TC-API-004 — The API handles an empty or absent body without failing

## Objective
Prove that a request carrying no usable payload yields a validation error rather than an
unhandled exception and a stack trace.

## References
| Reference | Type | Source | What it demands |
| --- | --- | --- | --- |
| `BSI-P-13` | BSI practice | 200-3 §7 — User friendliness | Safeguards must tolerate operating errors |

## Preconditions
- The application is running at `http://localhost:3000`.

## Test Data
| Field | Value |
| --- | --- |
| Body A | `{}` with `Content-Type: application/json` |
| Body B | no body and no `Content-Type` at all |

## Scenario

**Given** the application is running
**When** the client sends `POST /api/login` with an empty JSON object
**Then** the response status is `400`
**And** the body equals `{"ok":false,"error":"Username and password are required."}`
**When** the client sends `POST /api/login` with no body at all
**Then** the response status is `400`
**And** the response status is not a `5xx`

## Expected Result
Missing payloads are refused as bad requests. The server does not crash and returns no
stack trace.

## Postconditions
- No session is created; no state changes.

## Risk & Coverage
Not applicable — reliability case. The information-disclosure aspect of an unhandled error
is covered by TC-UI-005.

## Test Script
Implemented in `tests/scripts/TC-API-004.test.js` — run with `npm test`.

```javascript
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { useServer, form, json, login, testid, inputValue } = require('./_harness');

const ctx = useServer();

test('TC-API-004 — the API handles an empty or absent body without failing', async () => {
  const empty = await fetch(`${ctx.base}/api/login`, json({}));
  assert.equal(empty.status, 400);
  assert.deepEqual(await empty.json(), {
    ok: false,
    error: 'Username and password are required.',
  });

  const none = await fetch(`${ctx.base}/api/login`, json(undefined));
  assert.equal(none.status, 400);
  assert.ok(none.status < 500, 'an absent body must not raise a server error');
});
```

## Change Log
| Version | Date | Author | Change | Reason |
| --- | --- | --- | --- | --- |
| 2 | 2026-09-14 | marc.riegel@nimbusforge.de | Migrated to the ISTQB case format and automated | The `write-test-case` skill requires traceability, recurrence metadata and an executable script |
| 1 | 2026-09-14 | marc.riegel@nimbusforge.de | Created | A missing payload must not crash the endpoint |

## Notes
The two bodies take different code paths. `{}` is parsed successfully and fails the presence
check; a request with no `Content-Type` is never parsed at all, so `req.body` is undefined
and the `|| {}` fallback at `server.js:64` is what keeps it from throwing. Both are worth
asserting; only the second actually exercises that fallback.
