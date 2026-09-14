---
id: TC-SESS-005
title: A session cookie the server never issued is rejected
version: 2
status: approved
owner: marc.riegel@nimbusforge.de
created: 2026-09-14
updated: 2026-09-14
test_level: system
test_type: security
design_technique: error-guessing
priority: critical
suite: security
frequency: per-commit
automation: automated
script: tests/scripts/TC-SESS-005.test.js
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

# TC-SESS-005 — A session cookie the server never issued is rejected

## Objective
Prove the session check validates the identifier against issued sessions rather than merely
noticing that a `sid` cookie is present.

## References
| Reference | Type | Source | What it demands |
| --- | --- | --- | --- |
| `BSI-P-13` | BSI practice | 200-3 §7 — User friendliness | The safeguard must not be easy to circumvent |

## Preconditions
- The application is running at `http://localhost:3000`.
- The client has never authenticated.

## Test Data
| Field | Value |
| --- | --- |
| Cookie A | `sid=not-a-real-session-id` |
| Cookie B | `sid=` (empty value) |
| Cookie C | `sid=k3j2h1g0f9e8d7c6b5a4` (plausible-looking) |

## Scenario

**Given** a client that has never authenticated
**When** the client requests `GET /success` carrying a `sid` value the server never issued
**Then** the response status is `302` with `Location: /`
**And** the response body does not contain `Login successful`
**And** the same holds for an empty `sid` value and for a plausible-looking random value

## Expected Result
Only identifiers the server actually issued are honoured; fabricating a cookie achieves
nothing.

## Postconditions
- None — the case makes no state change.

## Risk & Coverage
| Field | Value |
| --- | --- |
| Core value (BSI-P-01) | Confidentiality, Integrity |
| Elementary threat (BSI-P-02) | G 0.36 Identity theft; G 0.30 Unauthorised use or administration of devices and systems |
| Frequency of occurrence (BSI-P-06) | `very-frequently` — cookie tampering is trivial and universally attempted |
| Extent of damage (BSI-P-06) | `considerable` — a forged cookie that worked would bypass authentication entirely |
| Risk category (BSI-P-07) | `very-high` (considerable × very-frequently) |
| Treatment option (BSI-P-08) | B — Risk reduction: `sessions.get` at `server.js:22` returns `undefined` for unknown identifiers |
| Residual risk | Session identifiers are generated with `Math.random()` at `server.js:44`, which is not a cryptographic RNG. This case proves an arbitrary value is rejected; it does *not* prove an identifier cannot be predicted. See Notes. |

## Test Script
Implemented in `tests/scripts/TC-SESS-005.test.js` — run with `npm test`.

```javascript
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { useServer, form, json, login, testid, inputValue } = require('./_harness');

const ctx = useServer();

test('TC-SESS-005 — a session cookie the server never issued is rejected', async () => {
  for (const value of ['sid=not-a-real-session-id', 'sid=', 'sid=k3j2h1g0f9e8d7c6b5a4']) {
    const res = await fetch(`${ctx.base}/success`, { headers: { cookie: value }, redirect: 'manual' });

    assert.equal(res.status, 302, `${value} was not rejected`);
    assert.equal(res.headers.get('location'), '/');
    assert.doesNotMatch(await res.text(), /Login successful/);
  }
});
```

## Change Log
| Version | Date | Author | Change | Reason |
| --- | --- | --- | --- | --- |
| 2 | 2026-09-14 | marc.riegel@nimbusforge.de | Migrated to the ISTQB case format; added the empty and plausible-looking cookie values | One hard-coded junk value did not cover the equivalence class; an empty `sid` takes a different path through `sessions.get` |
| 1 | 2026-09-14 | marc.riegel@nimbusforge.de | Created | A forged cookie must not grant access |

## Notes
**Known weakness, recorded per BSI-P-09.** `server.js:44` builds the identifier from
`Math.random()` and `Date.now()`. `Math.random()` is not a cryptographically secure source,
so an attacker who observes a few identifiers may be able to predict others. This case
cannot detect that — it only proves that an *unrelated* value is refused. Closing the gap
needs `crypto.randomUUID()` in the application, after which a predictability case becomes
worth writing. Accepted for now because the app is a disposable test target.
