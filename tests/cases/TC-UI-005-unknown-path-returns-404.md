---
id: TC-UI-005
title: An unknown path returns 404 without leaking internals
version: 1
status: approved
owner: marc.riegel@nimbusforge.de
created: 2026-09-14
updated: 2026-09-14
test_level: system
test_type: security
design_technique: error-guessing
priority: medium
suite: security
frequency: per-commit
automation: automated
script: tests/scripts/TC-UI-005.test.js
duration: 0.1s
environment: local-dev
last_reviewed: 2026-09-14
review_interval: 6m
stability: stable
references:
  - id: BSI-P-11
    type: bsi-practice
    source: BSI-Standard 200-3 §7 — Suitability of security safeguards
    demand: All aspects of the relevant threat must be covered in full.
---

# TC-UI-005 — An unknown path returns 404 without leaking internals

## Objective
Prove that probing for paths that do not exist yields a plain 404 and never a stack trace,
a filesystem path, or protected content.

## References
| Reference | Type | Source | What it demands |
| --- | --- | --- | --- |
| `BSI-P-11` | BSI practice | 200-3 §7 — Suitability | All aspects of the threat covered in full |

## Preconditions
- The application is running at `http://localhost:3000`.

## Test Data
| Field | Value |
| --- | --- |
| Endpoint | `GET /does-not-exist` |

## Scenario

**Given** the application is running
**When** the client requests a path that no route handles
**Then** the response status is `404`
**And** the response body does not contain `Login successful`
**And** the response body contains no stack trace or filesystem path

## Expected Result
Unmapped paths are refused with a bare 404 that tells an attacker nothing about the server.

## Postconditions
- None — the case makes no state change.

## Risk & Coverage
| Field | Value |
| --- | --- |
| Core value (BSI-P-01) | Confidentiality |
| Elementary threat (BSI-P-02) | G 0.19 Disclosure of information that should be protected; G 0.14 Espionage |
| Frequency of occurrence (BSI-P-06) | `very-frequently` — automated path scanning is constant on any exposed host |
| Extent of damage (BSI-P-06) | `limited` — disclosure aids reconnaissance but is not itself a breach |
| Risk category (BSI-P-07) | `high` (limited × very-frequently) |
| Treatment option (BSI-P-08) | B — Risk reduction: Express's default 404 handler discloses nothing |
| Residual risk | Priority is set to `medium` rather than the `high` the matrix yields — see Notes. |

## Test Script
Implemented in `tests/scripts/TC-UI-005.test.js` — run with `npm test`.

```javascript
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { useServer, form, json, login, testid, inputValue } = require('./_harness');

const ctx = useServer();

test('TC-UI-005 — an unknown path returns 404 without leaking internals', async () => {
  const res = await fetch(`${ctx.base}/does-not-exist`, { redirect: 'manual' });
  const body = await res.text();

  assert.equal(res.status, 404);
  assert.doesNotMatch(body, /Login successful/);
  assert.doesNotMatch(body, /at Object\.|node_modules|\/home\//, 'response leaks a stack trace or filesystem path');
});
```

## Change Log
| Version | Date | Author | Change | Reason |
| --- | --- | --- | --- | --- |
| 1 | 2026-09-14 | marc.riegel@nimbusforge.de | Created | Gap found during the review of the legacy case set: no case covered unmapped paths |

## Notes
Priority override, justified per BSI-P-07: the matrix yields `high`, but the safeguard here
is the framework default rather than application code, so a regression is unlikely to come
from this repo. Set to `medium`. If a custom error handler is ever added, restore `high` —
that is exactly when this case starts earning its keep.

The app runs without `NODE_ENV=production`, so Express would include a stack trace in a
`500` response. This case only covers `404`; a `500`-path case would need a route that
throws, which does not currently exist.
