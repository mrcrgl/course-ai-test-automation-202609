---
id: TC-AUTH-010
title: Username matching is case-sensitive
version: 2
status: approved
owner: marc.riegel@nimbusforge.de
created: 2026-09-14
updated: 2026-09-14
test_level: system
test_type: security
design_technique: equivalence-partitioning
priority: medium
suite: regression
frequency: per-commit
automation: automated
script: tests/scripts/TC-AUTH-010.test.js
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

# TC-AUTH-010 — Username matching is case-sensitive

## Objective
Pin the current matching rule: `Admin` is a different identity from `admin` and does not
authenticate.

## References
| Reference | Type | Source | What it demands |
| --- | --- | --- | --- |
| `BSI-P-11` | BSI practice | 200-3 §7 — Suitability | All aspects of the threat covered in full |

## Preconditions
- The application is running at `http://localhost:3000`.
- The client holds no `sid` session cookie.
- Only the lower-case `admin` exists at `server.js:9`.

## Test Data
| Field | Value |
| --- | --- |
| Username | `Admin` |
| Password | `admin123` |

## Scenario

**Given** the client holds no `sid` session cookie
**And** the user has entered the username `Admin` with a capital `A`
**And** the user has entered the otherwise correct password `admin123`
**When** the user submits the login form
**Then** the response status is `401`
**And** the element with `data-testid="error-message"` reads `Invalid username or password.`
**And** no `sid` session cookie is set

## Expected Result
The login is refused because `Admin` is not a configured account.

## Postconditions
- No session is created; the in-memory session map is unchanged.

## Risk & Coverage
| Field | Value |
| --- | --- |
| Core value (BSI-P-01) | Integrity |
| Elementary threat (BSI-P-02) | G 0.36 Identity theft |
| Frequency of occurrence (BSI-P-06) | `rarely` — requires a change to the lookup rule to become exploitable |
| Extent of damage (BSI-P-06) | `limited` — case-folding would merge identities rather than bypass the password |
| Risk category (BSI-P-07) | `low` (limited × rarely) |
| Treatment option (BSI-P-08) | D — Risk acceptance: the exact-match lookup is current behaviour, not a chosen countermeasure |
| Residual risk | Accepted. Case-sensitive usernames are a usability irritation, not a security weakness, in an app with two static accounts. |

## Test Script
Implemented in `tests/scripts/TC-AUTH-010.test.js` — run with `npm test`.

```javascript
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { useServer, form, json, login, testid, inputValue } = require('./_harness');

const ctx = useServer();

test('TC-AUTH-010 — a username differing only in case is rejected', async () => {
  const res = await fetch(`${ctx.base}/login`, form({ username: 'Admin', password: 'admin123' }));
  const body = await res.text();

  assert.equal(res.status, 401);
  assert.equal(testid(body, 'error-message'), 'Invalid username or password.');
  assert.equal(res.headers.getSetCookie().filter((c) => c.startsWith('sid=')).length, 0);
  assert.equal(res.headers.get('location'), null);
});
```

## Change Log
| Version | Date | Author | Change | Reason |
| --- | --- | --- | --- | --- |
| 2 | 2026-09-14 | marc.riegel@nimbusforge.de | Migrated to the ISTQB case format and automated | The `write-test-case` skill requires traceability, recurrence metadata and an executable script |
| 1 | 2026-09-14 | marc.riegel@nimbusforge.de | Created | Documents the current matching rule so a change to it is deliberate |

## Notes
Priority raised from the matrix's `low` to `medium` because this case is the only record of
the matching rule; without it a change to case-insensitive lookup would go unnoticed.

Treatment option D is unusual for a case that exists at all (BSI-P-09 normally means no
case). It is justified here: the case is not evidence of a countermeasure, it is a
regression pin on behaviour that was never a security decision. If case-insensitive
usernames are ever wanted, rewrite this case — do not delete it.
