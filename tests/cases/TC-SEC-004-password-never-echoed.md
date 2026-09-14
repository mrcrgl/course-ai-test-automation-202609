---
id: TC-SEC-004
title: A submitted password is never echoed back in a response
version: 1
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
script: tests/scripts/TC-SEC-004.test.js
duration: 0.2s
environment: local-dev
last_reviewed: 2026-09-14
review_interval: 3m
stability: stable
references:
  - id: BSI-P-11
    type: bsi-practice
    source: BSI-Standard 200-3 §7 — Suitability of security safeguards
    demand: All aspects of the relevant threat must be covered in full, across every response path.
---

# TC-SEC-004 — A submitted password is never echoed back in a response

## Objective
Prove the password never appears in any response body, on any path — failed login, success
page, or API — where it could reach a proxy log, a cache or a browser's view-source.

## References
| Reference | Type | Source | What it demands |
| --- | --- | --- | --- |
| `BSI-P-11` | BSI practice | 200-3 §7 — Suitability | All aspects of the threat covered in full, across every response path |

## Preconditions
- The application is running at `http://localhost:3000`.
- The client holds no `sid` session cookie.

## Test Data
| Field | Value |
| --- | --- |
| Probe password | `SuperSecret123` |
| Valid password | `admin123` |

## Scenario

**Given** the client holds no `sid` session cookie
**When** the user submits the login form with the password `SuperSecret123`
**Then** the response status is `401`
**And** the response body does not contain `SuperSecret123`
**When** the user logs in successfully with `admin123`
**Then** the success page body does not contain `admin123`
**When** the client posts `SuperSecret123` to `POST /api/login`
**Then** the JSON response does not contain `SuperSecret123`

## Expected Result
No response on any path contains the submitted password.

## Postconditions
- One session is created by the successful login in the middle step.

## Risk & Coverage
| Field | Value |
| --- | --- |
| Core value (BSI-P-01) | Confidentiality |
| Elementary threat (BSI-P-02) | G 0.19 Disclosure of information that should be protected; G 0.45 Loss of data |
| Frequency of occurrence (BSI-P-06) | `rarely` — requires an implementation mistake rather than an attacker action |
| Extent of damage (BSI-P-06) | `considerable` — a password in a response reaches caches, proxies and logs, and outlives any session |
| Risk category (BSI-P-07) | `medium` (considerable × rarely) |
| Treatment option (BSI-P-08) | A — Risk avoidance: no response path includes the password in its output |
| Residual risk | Covers response bodies only. The password is still transmitted in clear over plain HTTP, which TLS would address; there is no case for that because the demo does not serve HTTPS. |

## Test Script
Implemented in `tests/scripts/TC-SEC-004.test.js` — run with `npm test`.

```javascript
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { useServer, form, json, login, testid, inputValue } = require('./_harness');

const ctx = useServer();

test('TC-SEC-004 — a submitted password is never echoed back in a response', async () => {
  const secret = 'SuperSecret123';

  const failed = await fetch(`${ctx.base}/login`, form({ username: 'admin', password: secret }));
  assert.equal(failed.status, 401);
  assert.doesNotMatch(await failed.text(), new RegExp(secret));

  const ok = await fetch(`${ctx.base}/login`, form({ username: 'admin', password: 'admin123' }));
  const sid = ok.headers.getSetCookie().find((c) => c.startsWith('sid=')).split(';')[0];
  const success = await fetch(`${ctx.base}/success`, { headers: { cookie: sid } });
  assert.doesNotMatch(await success.text(), /admin123/, 'the success page echoes the password');

  const api = await fetch(`${ctx.base}/api/login`, json({ username: 'admin', password: secret }));
  assert.doesNotMatch(await api.text(), new RegExp(secret));
});
```

## Change Log
| Version | Date | Author | Change | Reason |
| --- | --- | --- | --- | --- |
| 1 | 2026-09-14 | marc.riegel@nimbusforge.de | Created | Gap found during the review of the legacy case set: TC-AUTH-011 checked the password field was empty, but nothing checked the whole response across all three paths |

## Notes
Priority raised from the matrix's `medium` to `high` because the failure is silent: a
password echoed into a hidden field or a debug key would break no other case in the suite.

Three `**When**` steps are used because the behaviour under test is a single invariant —
"the password appears in no response" — and it is only meaningful when checked across every
path that produces one. Splitting it would lose the invariant.

Broader than TC-AUTH-011, which only asserts the password input carries no `value`
attribute. This one searches the entire body of every response.
