---
id: TC-SESS-004
title: A session identifier is rejected after logout
version: 2
status: approved
owner: marc.riegel@nimbusforge.de
created: 2026-09-14
updated: 2026-09-14
test_level: system
test_type: security
design_technique: state-transition
priority: critical
suite: security
frequency: per-commit
automation: automated
script: tests/scripts/TC-SESS-004.test.js
duration: 0.1s
environment: local-dev
last_reviewed: 2026-09-14
review_interval: 3m
stability: stable
references:
  - id: BSI-P-12
    type: bsi-practice
    source: BSI-Standard 200-3 §7 — Interaction of security safeguards
    demand: Safeguards must support each other and produce an effective entity in combination.
---

# TC-SESS-004 — A session identifier is rejected after logout

## Objective
Prove logout invalidates the session server-side, so a cookie captured before logout cannot
be replayed afterwards.

## References
| Reference | Type | Source | What it demands |
| --- | --- | --- | --- |
| `BSI-P-12` | BSI practice | 200-3 §7 — Interaction | Safeguards must combine into an effective entity, not merely work in isolation |

## Preconditions
- The application is running at `http://localhost:3000`.
- The tester has recorded the `sid` value issued during a successful login as `admin`.

## Test Data
| Field | Value |
| --- | --- |
| Cookie | `sid=<value captured before logout>` |

## Scenario

**Given** the user logged in as `admin` and the `sid` value was recorded
**And** that session is confirmed valid before logout
**When** the user logs out via `POST /logout`
**And** a client replays the recorded `sid` against `GET /success`
**Then** the response status is `302` with `Location: /`
**And** the response body does not contain `Login successful`

## Expected Result
The old identifier is dead. The server discarded the session rather than relying on the
client to forget the cookie.

## Postconditions
- The session is absent from the server-side session map.

## Risk & Coverage
| Field | Value |
| --- | --- |
| Core value (BSI-P-01) | Confidentiality, Integrity |
| Elementary threat (BSI-P-02) | G 0.36 Identity theft; G 0.23 Unauthorised entry into IT systems |
| Frequency of occurrence (BSI-P-06) | `medium` — replay requires the attacker to have captured a cookie first |
| Extent of damage (BSI-P-06) | `considerable` — a full authenticated session belonging to someone who believes they logged out |
| Risk category (BSI-P-07) | `high` (considerable × medium) |
| Treatment option (BSI-P-08) | B — Risk reduction: `sessions.delete` at `server.js:57` is the safeguard |
| Residual risk | Sessions never expire on their own. A cookie captured from a user who simply closed the browser without logging out stays valid until the process restarts. No idle-timeout case exists because the application has no timeout. |

## Test Script
Implemented in `tests/scripts/TC-SESS-004.test.js` — run with `npm test`.

```javascript
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { useServer, form, json, login, testid, inputValue } = require('./_harness');

const ctx = useServer();

test('TC-SESS-004 — a session identifier is rejected after logout', async () => {
  const sid = await login(ctx.base, 'admin', 'admin123');

  const before = await fetch(`${ctx.base}/success`, { headers: { cookie: sid }, redirect: 'manual' });
  assert.equal(before.status, 200, 'precondition: the session should be valid before logout');

  await fetch(`${ctx.base}/logout`, { method: 'POST', headers: { cookie: sid }, redirect: 'manual' });

  // Replaying the captured cookie must not work even though the client still holds it.
  const replay = await fetch(`${ctx.base}/success`, { headers: { cookie: sid }, redirect: 'manual' });

  assert.equal(replay.status, 302);
  assert.equal(replay.headers.get('location'), '/');
  assert.doesNotMatch(await replay.text(), /Login successful/);
});
```

## Change Log
| Version | Date | Author | Change | Reason |
| --- | --- | --- | --- | --- |
| 2 | 2026-09-14 | marc.riegel@nimbusforge.de | Migrated to the ISTQB case format and automated | The `write-test-case` skill requires traceability, risk classification and an executable script |
| 1 | 2026-09-14 | marc.riegel@nimbusforge.de | Created | Logout must invalidate server-side, not just clear the cookie |

## Notes
The script asserts the session is valid *before* logout. Without that precondition check the
case would pass trivially against a build where the session never worked at all.

The residual risk above — no session expiry — is a real gap, recorded rather than hidden per
BSI-P-09. Closing it needs an application change first, then a case.
