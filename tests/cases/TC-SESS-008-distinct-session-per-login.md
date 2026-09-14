---
id: TC-SESS-008
title: Every login is issued a distinct session identifier
version: 1
status: approved
owner: marc.riegel@nimbusforge.de
created: 2026-09-14
updated: 2026-09-14
test_level: system
test_type: security
design_technique: error-guessing
priority: high
suite: security
frequency: per-commit
automation: automated
script: tests/scripts/TC-SESS-008.test.js
duration: 0.1s
environment: local-dev
last_reviewed: 2026-09-14
review_interval: 3m
stability: stable
references:
  - id: BSI-P-11
    type: bsi-practice
    source: BSI-Standard 200-3 §7 — Suitability of security safeguards
    demand: The counteraction must match the security objective — a session identifier must identify one session.
---

# TC-SESS-008 — Every login is issued a distinct session identifier

## Objective
Prove that logging in twice produces two different, independently valid session
identifiers, rather than a shared or reused one.

## References
| Reference | Type | Source | What it demands |
| --- | --- | --- | --- |
| `BSI-P-11` | BSI practice | 200-3 §7 — Suitability | The counteraction must match the security objective |

## Preconditions
- The application is running at `http://localhost:3000`.

## Test Data
| Field | Value |
| --- | --- |
| Username | `admin` (both logins) |
| Password | `admin123` |

## Scenario

**Given** the application is running
**When** the same account logs in twice in succession
**Then** both logins issue a `sid` cookie
**And** the two identifiers differ
**And** each identifier independently grants access to `/success`

## Expected Result
Each login gets its own session. One user's identifier is never handed to another login.

## Postconditions
- Two independent sessions exist for `admin`.

## Risk & Coverage
| Field | Value |
| --- | --- |
| Core value (BSI-P-01) | Confidentiality, Integrity |
| Elementary threat (BSI-P-02) | G 0.36 Identity theft |
| Frequency of occurrence (BSI-P-06) | `rarely` — requires an implementation defect rather than an attacker action |
| Extent of damage (BSI-P-06) | `considerable` — a shared or fixed identifier would let any user assume another's session |
| Risk category (BSI-P-07) | `medium` (considerable × rarely) |
| Treatment option (BSI-P-08) | B — Risk reduction: a fresh identifier is generated per login at `server.js:44` |
| Residual risk | Identifiers come from `Math.random()`, which is not a cryptographic RNG. This case proves they are *distinct*; it does not prove they are *unpredictable*. See TC-SESS-005. |

## Test Script
Implemented in `tests/scripts/TC-SESS-008.test.js` — run with `npm test`.

```javascript
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { useServer, form, json, login, testid, inputValue } = require('./_harness');

const ctx = useServer();

test('TC-SESS-008 — every login is issued a distinct session identifier', async () => {
  const first = await login(ctx.base, 'admin', 'admin123');
  const second = await login(ctx.base, 'admin', 'admin123');

  assert.ok(first && second, 'both logins must issue a cookie');
  assert.notEqual(first, second, 'two logins reused the same session identifier');

  // Both must independently address a live session.
  for (const sid of [first, second]) {
    const res = await fetch(`${ctx.base}/success`, { headers: { cookie: sid }, redirect: 'manual' });
    assert.equal(res.status, 200);
  }
});
```

## Change Log
| Version | Date | Author | Change | Reason |
| --- | --- | --- | --- | --- |
| 1 | 2026-09-14 | marc.riegel@nimbusforge.de | Created | Gap found during the review of the legacy case set: nothing asserted that session identifiers are per-login |

## Notes
Priority raised from the matrix's `medium` to `high`: a fixed session identifier is one of
the failure modes that is both catastrophic and completely invisible to every other case in
the suite.

The final assertion — that *both* identifiers still work — is what distinguishes this from a
uniqueness check. An implementation that issued a new identifier while silently destroying
the previous session would produce two distinct values and fail here, correctly.
