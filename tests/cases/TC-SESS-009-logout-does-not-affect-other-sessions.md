---
id: TC-SESS-009
title: Logging out of one session leaves other sessions untouched
version: 1
status: approved
owner: marc.riegel@nimbusforge.de
created: 2026-09-14
updated: 2026-09-14
test_level: integration
test_type: security
design_technique: state-transition
priority: high
suite: security
frequency: per-commit
automation: automated
script: tests/scripts/TC-SESS-009.test.js
duration: 0.1s
environment: local-dev
last_reviewed: 2026-09-14
review_interval: 3m
stability: stable
references:
  - id: BSI-P-12
    type: bsi-practice
    source: BSI-Standard 200-3 §7 — Interaction of security safeguards
    demand: Safeguards must support each other in counteracting threats and must not conflict with each other.
---

# TC-SESS-009 — Logging out of one session leaves other sessions untouched

## Objective
Prove logout is scoped to the session that requested it. One user signing out must not
sign out anybody else.

## References
| Reference | Type | Source | What it demands |
| --- | --- | --- | --- |
| `BSI-P-12` | BSI practice | 200-3 §7 — Interaction | Safeguards must not conflict with each other |

## Preconditions
- The application is running at `http://localhost:3000`.
- Two independent sessions exist: `admin` (session A) and `tester` (session B).

## Test Data
| Field | Value |
| --- | --- |
| Session A | `admin` / `admin123` |
| Session B | `tester` / `test123` |

## Scenario

**Given** `admin` is logged in as session A
**And** `tester` is logged in as session B
**When** session A logs out
**Then** session A no longer grants access to `/success`
**And** session B still returns `200` from `/success`
**And** session B's success page still names `tester`

## Expected Result
Logout destroys exactly one session. Concurrent sessions are unaffected.

## Postconditions
- Session A is destroyed; session B remains valid.

## Risk & Coverage
| Field | Value |
| --- | --- |
| Core value (BSI-P-01) | Availability, Integrity |
| Elementary threat (BSI-P-02) | G 0.40 Denial of services; G 0.32 Misuse of authorisations |
| Frequency of occurrence (BSI-P-06) | `rarely` — requires an implementation defect in the logout scope |
| Extent of damage (BSI-P-06) | `limited` — other users are signed out and must log in again |
| Risk category (BSI-P-07) | `low` (limited × rarely) |
| Treatment option (BSI-P-08) | B — Risk reduction: `sessions.delete` is keyed by the requesting client's own `sid` |
| Residual risk | The case uses two sessions. A defect that only appears at higher concurrency would not be caught. |

## Test Script
Implemented in `tests/scripts/TC-SESS-009.test.js` — run with `npm test`.

```javascript
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { useServer, form, json, login, testid, inputValue } = require('./_harness');

const ctx = useServer();

test('TC-SESS-009 — logging out of one session leaves other sessions untouched', async () => {
  const a = await login(ctx.base, 'admin', 'admin123');
  const b = await login(ctx.base, 'tester', 'test123');

  await fetch(`${ctx.base}/logout`, { method: 'POST', headers: { cookie: a }, redirect: 'manual' });

  const killed = await fetch(`${ctx.base}/success`, { headers: { cookie: a }, redirect: 'manual' });
  assert.equal(killed.status, 302, 'session A should be gone');

  const survivor = await fetch(`${ctx.base}/success`, { headers: { cookie: b }, redirect: 'manual' });
  assert.equal(survivor.status, 200, 'session B must survive');
  assert.equal(testid(await survivor.text(), 'username'), 'tester');
});
```

## Change Log
| Version | Date | Author | Change | Reason |
| --- | --- | --- | --- | --- |
| 1 | 2026-09-14 | marc.riegel@nimbusforge.de | Created | Gap found during the review of the legacy case set: every session case used a single session, so nothing covered isolation between them |

## Notes
Priority raised from the matrix's `low` to `high`. The damage is limited, but this is the
only case in the suite that exercises two concurrent sessions at all — a `sessions.clear()`
where a `sessions.delete(sid)` was meant would pass every other session case.

The assertion that session A *is* gone matters as much as the one that B survives: without
it, an implementation where logout did nothing would pass.
