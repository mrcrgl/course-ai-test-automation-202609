---
id: TC-SESS-006
title: The session cookie is issued with HttpOnly, SameSite and Path
version: 2
status: approved
owner: marc.riegel@nimbusforge.de
created: 2026-09-14
updated: 2026-09-14
test_level: system
test_type: security
design_technique: checklist-based
priority: high
suite: security
frequency: per-commit
automation: automated
script: tests/scripts/TC-SESS-006.test.js
duration: 0.1s
environment: local-dev
last_reviewed: 2026-09-14
review_interval: 3m
stability: stable
references:
  - id: BSI-P-12
    type: bsi-practice
    source: BSI-Standard 200-3 §7 — Interaction of security safeguards
    demand: Safeguards must support each other; an effective entity must be produced by their interaction.
---

# TC-SESS-006 — The session cookie is issued with HttpOnly, SameSite and Path

## Objective
Prove the session cookie carries the attributes that keep it out of reach of page scripts
and off cross-site requests.

## References
| Reference | Type | Source | What it demands |
| --- | --- | --- | --- |
| `BSI-P-12` | BSI practice | 200-3 §7 — Interaction | Safeguards must combine into an effective entity |

## Preconditions
- The application is running at `http://localhost:3000`.
- The client holds no `sid` session cookie.

## Test Data
| Field | Value |
| --- | --- |
| Username | `admin` |
| Password | `admin123` |

## Scenario

**Given** the client holds no `sid` session cookie
**When** the user logs in with valid credentials
**Then** the response carries a `Set-Cookie` header for `sid`
**And** the header includes `HttpOnly`
**And** the header includes `SameSite=Lax`
**And** the header includes `Path=/`

## Expected Result
The session cookie is inaccessible to page scripts and is not sent on cross-site requests.

## Postconditions
- A session exists for `admin`.

## Risk & Coverage
| Field | Value |
| --- | --- |
| Core value (BSI-P-01) | Confidentiality |
| Elementary threat (BSI-P-02) | G 0.36 Identity theft; G 0.43 Importing messages |
| Frequency of occurrence (BSI-P-06) | `frequently` — cookie theft via script and cross-site submission are both routine attack patterns |
| Extent of damage (BSI-P-06) | `considerable` — a stolen session identifier is a full account takeover |
| Risk category (BSI-P-07) | `high` (considerable × frequently) |
| Treatment option (BSI-P-08) | B — Risk reduction: the cookie options at `server.js:46` are the safeguard |
| Residual risk | `Secure` is deliberately absent because the demo runs over plain HTTP; over HTTPS its absence would be a defect. This case must gain a `Secure` assertion the day the app is served over TLS. |

## Test Script
Implemented in `tests/scripts/TC-SESS-006.test.js` — run with `npm test`.

```javascript
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { useServer, form, json, login, testid, inputValue } = require('./_harness');

const ctx = useServer();

test('TC-SESS-006 — the session cookie is issued with HttpOnly, SameSite and Path', async () => {
  const res = await fetch(`${ctx.base}/login`, form({ username: 'admin', password: 'admin123' }));
  const cookie = res.headers.getSetCookie().find((c) => c.startsWith('sid='));

  assert.ok(cookie, 'no sid cookie was issued');
  assert.match(cookie, /HttpOnly/i);
  assert.match(cookie, /SameSite=Lax/i);
  assert.match(cookie, /Path=\//);
});
```

## Change Log
| Version | Date | Author | Change | Reason |
| --- | --- | --- | --- | --- |
| 2 | 2026-09-14 | marc.riegel@nimbusforge.de | Migrated to the ISTQB case format and automated | The `write-test-case` skill requires traceability, risk classification and an executable script |
| 1 | 2026-09-14 | marc.riegel@nimbusforge.de | Created | Session cookie hardening must not silently regress |

## Notes
This is the BSI-P-12 interaction case for the session mechanism: the cookie attributes and
the server-side session lookup are separate safeguards, and each is worthless if the other
fails. TC-SESS-005 covers the lookup half.

`HttpOnly` cannot be verified from Node — `fetch` sees the header regardless. The assertion
here is on the header the server sends, which is the thing the application controls; whether
a browser honours it is the browser's contract, not this application's.
