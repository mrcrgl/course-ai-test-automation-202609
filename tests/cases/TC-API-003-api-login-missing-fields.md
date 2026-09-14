---
id: TC-API-003
title: The API rejects an incomplete payload with 400
version: 2
status: approved
owner: marc.riegel@nimbusforge.de
created: 2026-09-14
updated: 2026-09-14
test_level: integration
test_type: functional
design_technique: boundary-value-analysis
priority: medium
suite: regression
frequency: per-commit
automation: automated
script: tests/scripts/TC-API-003.test.js
duration: 0.1s
environment: local-dev
last_reviewed: 2026-09-14
review_interval: 6m
stability: stable
references:
  - id: BSI-P-13
    type: bsi-practice
    source: BSI-Standard 200-3 §7 — User friendliness of security safeguards
    demand: Safeguards must be tolerant towards user and operating errors, and it must be clear when one has acted.
---

# TC-API-003 — The API rejects an incomplete payload with 400

## Objective
Prove the JSON endpoint distinguishes a malformed request from a rejected credential, so a
client can tell a bug from a failed login.

## References
| Reference | Type | Source | What it demands |
| --- | --- | --- | --- |
| `BSI-P-13` | BSI practice | 200-3 §7 — User friendliness | Tolerance of operating errors; the caller can tell what happened |

## Preconditions
- The application is running at `http://localhost:3000`.

## Test Data
| Field | Value |
| --- | --- |
| Body A | `{"username":"admin"}` |
| Body B | `{"password":"admin123"}` |

## Scenario

**Given** the application is running
**When** the client sends `POST /api/login` with only a username
**Then** the response status is `400`
**And** the body equals `{"ok":false,"error":"Username and password are required."}`
**When** the client sends `POST /api/login` with only a password
**Then** the response status is `400`
**And** the body equals `{"ok":false,"error":"Username and password are required."}`

## Expected Result
Both incomplete payloads are rejected as bad requests, never as failed authentication.

## Postconditions
- No session is created; no state changes.

## Risk & Coverage
Not applicable — functional case, no threat model entry.

## Test Script
Implemented in `tests/scripts/TC-API-003.test.js` — run with `npm test`.

```javascript
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { useServer, form, json, login, testid, inputValue } = require('./_harness');

const ctx = useServer();

test('TC-API-003 — the API rejects an incomplete payload with 400, not 401', async () => {
  for (const payload of [{ username: 'admin' }, { password: 'admin123' }]) {
    const res = await fetch(`${ctx.base}/api/login`, json(payload));

    assert.equal(res.status, 400, `${JSON.stringify(payload)} should be a bad request`);
    assert.deepEqual(await res.json(), {
      ok: false,
      error: 'Username and password are required.',
    });
  }
});
```

## Change Log
| Version | Date | Author | Change | Reason |
| --- | --- | --- | --- | --- |
| 2 | 2026-09-14 | marc.riegel@nimbusforge.de | Migrated to the ISTQB case format and automated | The `write-test-case` skill requires traceability, recurrence metadata and an executable script |
| 1 | 2026-09-14 | marc.riegel@nimbusforge.de | Created | Incomplete input must be a bad request, not a failed login |

## Notes
Two `**When**` steps are used here because the case is a single equivalence class —
"payload missing one required field" — with two representatives. Splitting it into two cases
would duplicate everything except one literal.

API counterpart of TC-AUTH-006 and TC-AUTH-007.
