---
id: TC-API-001
title: The API accepts valid credentials
version: 2
status: approved
owner: marc.riegel@nimbusforge.de
created: 2026-09-14
updated: 2026-09-14
test_level: integration
test_type: functional
design_technique: equivalence-partitioning
priority: high
suite: regression
frequency: per-commit
automation: automated
script: tests/scripts/TC-API-001.test.js
duration: 0.1s
environment: local-dev
last_reviewed: 2026-09-14
review_interval: 6m
stability: stable
references:
  - id: API-LOGIN
    type: derived
    source: server.js:63 (POST /api/login)
    demand: The JSON endpoint confirms valid credentials and echoes the authenticated username.
---

# TC-API-001 — The API accepts valid credentials

## Objective
Prove the JSON login endpoint validates credentials and reports which account matched, in a
stable response shape a client can rely on.

## References
| Reference | Type | Source | What it demands |
| --- | --- | --- | --- |
| `API-LOGIN` | Derived | `server.js:63` | The endpoint confirms valid credentials and echoes the username |

## Preconditions
- The application is running at `http://localhost:3000`.

## Test Data
| Field | Value |
| --- | --- |
| Header | `Content-Type: application/json` |
| Body | `{"username":"tester","password":"test123"}` |

## Scenario

**Given** the application is running
**When** the client sends `POST /api/login` with valid credentials
**Then** the response status is `200`
**And** the `Content-Type` is `application/json`
**And** the body equals `{"ok":true,"username":"tester"}`
**And** the body does not contain the submitted password

## Expected Result
The endpoint confirms the credentials and names the account, without echoing the secret.

## Postconditions
- No session is created — asserted by TC-API-005.

## Risk & Coverage
Not applicable — functional case. The security properties of this endpoint are TC-API-002,
TC-API-005 and TC-API-006.

## Test Script
Implemented in `tests/scripts/TC-API-001.test.js` — run with `npm test`.

```javascript
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { useServer, form, json, login, testid, inputValue } = require('./_harness');

const ctx = useServer();

test('TC-API-001 — the API accepts valid credentials', async () => {
  const res = await fetch(`${ctx.base}/api/login`, json({ username: 'tester', password: 'test123' }));
  const body = await res.text();

  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /^application\/json/);
  assert.deepEqual(JSON.parse(body), { ok: true, username: 'tester' });
  assert.doesNotMatch(body, /test123/, 'the response echoes the password');
});
```

## Change Log
| Version | Date | Author | Change | Reason |
| --- | --- | --- | --- | --- |
| 2 | 2026-09-14 | marc.riegel@nimbusforge.de | Migrated to the ISTQB case format and automated | The `write-test-case` skill requires traceability, recurrence metadata and an executable script |
| 1 | 2026-09-14 | marc.riegel@nimbusforge.de | Created | The JSON endpoint is the API-level entry point for credential validation |

## Notes
The body is asserted by deep equality rather than by matching fields. An endpoint that
started returning extra keys — a token, a role, a session identifier — would fail here, and
that is intended: a change to the response shape of an auth endpoint should be deliberate.
