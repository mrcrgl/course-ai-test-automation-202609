---
id: TC-API-002
title: The API rejects invalid credentials with 401
version: 2
status: approved
owner: marc.riegel@nimbusforge.de
created: 2026-09-14
updated: 2026-09-14
test_level: integration
test_type: security
design_technique: equivalence-partitioning
priority: critical
suite: security
frequency: per-commit
automation: automated
script: tests/scripts/TC-API-002.test.js
duration: 0.1s
environment: local-dev
last_reviewed: 2026-09-14
review_interval: 3m
stability: stable
references:
  - id: BSI-P-11
    type: bsi-practice
    source: BSI-Standard 200-3 §7 — Suitability of security safeguards
    demand: All aspects of the relevant threat must be covered in full — including every interface that accepts credentials.
---

# TC-API-002 — The API rejects invalid credentials with 401

## Objective
Prove the JSON endpoint enforces the same credential check as the HTML form, so the API is
not a softer way in.

## References
| Reference | Type | Source | What it demands |
| --- | --- | --- | --- |
| `BSI-P-11` | BSI practice | 200-3 §7 — Suitability | Every interface that accepts credentials must be covered |

## Preconditions
- The application is running at `http://localhost:3000`.

## Test Data
| Field | Value |
| --- | --- |
| Body | `{"username":"tester","password":"nope"}` |

## Scenario

**Given** the application is running
**When** the client sends `POST /api/login` with a wrong password
**Then** the response status is `401`
**And** the body equals `{"ok":false,"error":"Invalid username or password."}`
**And** the body does not contain the correct password

## Expected Result
The credentials are rejected, with no hint as to which part was wrong.

## Postconditions
- No session is created; no state changes.

## Risk & Coverage
| Field | Value |
| --- | --- |
| Core value (BSI-P-01) | Confidentiality, Integrity |
| Elementary threat (BSI-P-02) | G 0.23 Unauthorised entry into IT systems; G 0.36 Identity theft |
| Frequency of occurrence (BSI-P-06) | `very-frequently` — an unauthenticated JSON endpoint is a preferred target for automated guessing |
| Extent of damage (BSI-P-06) | `considerable` — a bypass here confirms credentials usable against the HTML login |
| Risk category (BSI-P-07) | `very-high` (considerable × very-frequently) |
| Treatment option (BSI-P-08) | B — Risk reduction: the same credential comparison as the form path, at `server.js:69` |
| Residual risk | As on the HTML path: no rate limiting. The JSON endpoint makes volume guessing cheaper still, since it needs no HTML parsing. |

## Test Script
Implemented in `tests/scripts/TC-API-002.test.js` — run with `npm test`.

```javascript
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { useServer, form, json, login, testid, inputValue } = require('./_harness');

const ctx = useServer();

test('TC-API-002 — the API rejects a wrong password with 401', async () => {
  const res = await fetch(`${ctx.base}/api/login`, json({ username: 'tester', password: 'nope' }));
  const body = await res.text();

  assert.equal(res.status, 401);
  assert.deepEqual(JSON.parse(body), { ok: false, error: 'Invalid username or password.' });
  assert.doesNotMatch(body, /test123/, 'the response leaks the correct password');
});
```

## Change Log
| Version | Date | Author | Change | Reason |
| --- | --- | --- | --- | --- |
| 2 | 2026-09-14 | marc.riegel@nimbusforge.de | Migrated to the ISTQB case format and automated | The `write-test-case` skill requires traceability, risk classification and an executable script |
| 1 | 2026-09-14 | marc.riegel@nimbusforge.de | Created | The API must reject bad credentials exactly as the form does |

## Notes
The credential check is duplicated between `server.js:41` and `server.js:69` rather than
shared. That is why this case must exist alongside TC-AUTH-003: fixing one path would not
fix the other. If the two are ever unified, both cases should stay — they cover two
interfaces, not one implementation.
