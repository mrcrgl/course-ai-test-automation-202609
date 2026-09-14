---
id: TC-AUTH-009
title: Surrounding whitespace in the password is significant
version: 2
status: approved
owner: marc.riegel@nimbusforge.de
created: 2026-09-14
updated: 2026-09-14
test_level: system
test_type: security
design_technique: boundary-value-analysis
priority: high
suite: security
frequency: per-commit
automation: automated
script: tests/scripts/TC-AUTH-009.test.js
duration: 0.1s
environment: local-dev
last_reviewed: 2026-09-14
review_interval: 3m
stability: stable
references:
  - id: BSI-P-11
    type: bsi-practice
    source: BSI-Standard 200-3 §7 — Suitability of security safeguards
    demand: The counteraction must match the security objective — here, comparing the secret exactly as supplied.
---

# TC-AUTH-009 — Surrounding whitespace in the password is significant

## Objective
Prove the password is compared verbatim. Normalising a secret shrinks its keyspace, so the
absence of trimming is itself the safeguard under test.

## References
| Reference | Type | Source | What it demands |
| --- | --- | --- | --- |
| `BSI-P-11` | BSI practice | 200-3 §7 — Suitability | The counteraction must match the security objective |

## Preconditions
- The application is running at `http://localhost:3000`.
- The client holds no `sid` session cookie.

## Test Data
| Field | Value |
| --- | --- |
| Username | `admin` |
| Password | `␣admin123␣` (one space either side) |

## Scenario

**Given** the client holds no `sid` session cookie
**And** the user has entered the valid username `admin`
**And** the user has entered the password `␣admin123␣` with surrounding spaces
**When** the user submits the login form
**Then** the response status is `401`
**And** the element with `data-testid="error-message"` reads `Invalid username or password.`
**And** no `sid` session cookie is set

## Expected Result
The padded password does not match the stored secret and the login is refused.

## Postconditions
- No session is created; the in-memory session map is unchanged.

## Risk & Coverage
| Field | Value |
| --- | --- |
| Core value (BSI-P-01) | Confidentiality |
| Elementary threat (BSI-P-02) | G 0.23 Unauthorised entry into IT systems; G 0.31 Incorrect use or administration of devices and systems |
| Frequency of occurrence (BSI-P-06) | `rarely` — this is a latent implementation defect, not something an attacker triggers directly |
| Extent of damage (BSI-P-06) | `considerable` — normalising passwords weakens every credential at once |
| Risk category (BSI-P-07) | `medium` (considerable × rarely) |
| Treatment option (BSI-P-08) | A — Risk avoidance: no normalisation is applied to the password at all |
| Residual risk | None for whitespace. Other normalisations (Unicode, case) are untested because the application applies none. |

## Test Script
Implemented in `tests/scripts/TC-AUTH-009.test.js` — run with `npm test`.

```javascript
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { useServer, form, json, login, testid, inputValue } = require('./_harness');

const ctx = useServer();

test('TC-AUTH-009 — a password with surrounding whitespace does not match', async () => {
  const res = await fetch(`${ctx.base}/login`, form({ username: 'admin', password: ' admin123 ' }));
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
| 2 | 2026-09-14 | marc.riegel@nimbusforge.de | Migrated to the ISTQB case format; reclassified from a plain boundary case to `security` and added the risk block | Trimming a password is a credential-strength defect, not a usability quirk, so it needs a threat model entry |
| 1 | 2026-09-14 | marc.riegel@nimbusforge.de | Created | Whitespace can be a legitimate part of a password |

## Notes
Priority override, justified per BSI-P-07: the matrix yields `medium`, but this is raised to
`high` because a regression is silent — a developer adding `.trim()` to the password for
symmetry with the username would break every password containing leading or trailing
whitespace and no other case would notice.

Treatment option A rather than B is deliberate: the safeguard is the *absence* of a
normalisation step, so the case asserts a capability is not present.

Read together with TC-AUTH-008.
