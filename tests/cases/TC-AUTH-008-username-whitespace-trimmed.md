---
id: TC-AUTH-008
title: Surrounding whitespace in the username is trimmed
version: 2
status: approved
owner: marc.riegel@nimbusforge.de
created: 2026-09-14
updated: 2026-09-14
test_level: system
test_type: functional
design_technique: boundary-value-analysis
priority: medium
suite: regression
frequency: per-commit
automation: automated
script: tests/scripts/TC-AUTH-008.test.js
duration: 0.1s
environment: local-dev
last_reviewed: 2026-09-14
review_interval: 6m
stability: stable
references:
  - id: BSI-P-13
    type: bsi-practice
    source: BSI-Standard 200-3 §7 — User friendliness of security safeguards
    demand: Safeguards must be tolerant towards user and operating errors.
---

# TC-AUTH-008 — Surrounding whitespace in the username is trimmed

## Objective
Prove that a username pasted with stray spaces still authenticates, and that the trimmed
form is what the application uses thereafter.

## References
| Reference | Type | Source | What it demands |
| --- | --- | --- | --- |
| `BSI-P-13` | BSI practice | 200-3 §7 — User friendliness | Safeguards must tolerate user and operating errors |

## Preconditions
- The application is running at `http://localhost:3000`.
- The client holds no `sid` session cookie.

## Test Data
| Field | Value |
| --- | --- |
| Username | `␣␣admin␣␣` (two spaces either side) |
| Password | `admin123` |

## Scenario

**Given** the client holds no `sid` session cookie
**And** the user has entered the username `␣␣admin␣␣` with surrounding spaces
**And** the user has entered the correct password `admin123`
**When** the user submits the login form
**Then** the response status is `302` with `Location: /success`
**And** the element with `data-testid="username"` on the success page reads `admin`
**And** the displayed username carries no surrounding whitespace

## Expected Result
The padded username is trimmed and the login succeeds as `admin`.

## Postconditions
- A session exists for `admin`, keyed to the trimmed username.

## Risk & Coverage
Not applicable — functional case. The deliberate asymmetry with the password is covered by
TC-AUTH-009, which is classified as security.

## Test Script
Implemented in `tests/scripts/TC-AUTH-008.test.js` — run with `npm test`.

```javascript
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { useServer, form, json, login, testid, inputValue } = require('./_harness');

const ctx = useServer();

test('TC-AUTH-008 — surrounding whitespace in the username is trimmed', async () => {
  const res = await fetch(`${ctx.base}/login`, form({ username: '  admin  ', password: 'admin123' }));

  assert.equal(res.status, 302);
  assert.equal(res.headers.get('location'), '/success');

  const sid = res.headers.getSetCookie().find((c) => c.startsWith('sid=')).split(';')[0];
  const body = await (await fetch(`${ctx.base}/success`, { headers: { cookie: sid } })).text();
  const shown = testid(body, 'username');

  assert.equal(shown, 'admin');
  assert.equal(shown, shown.trim());
});
```

## Change Log
| Version | Date | Author | Change | Reason |
| --- | --- | --- | --- | --- |
| 2 | 2026-09-14 | marc.riegel@nimbusforge.de | Migrated to the ISTQB case format and automated | The `write-test-case` skill requires traceability, recurrence metadata and an executable script |
| 1 | 2026-09-14 | marc.riegel@nimbusforge.de | Created | Copy-pasted usernames commonly carry stray whitespace |

## Notes
This case and TC-AUTH-009 document a deliberate asymmetry: usernames are trimmed,
passwords are not. Both must be read together — changing one without the other means the
pair now describes behaviour the application no longer has.

The final assertion (no surrounding whitespace in what is displayed) catches a trim applied
only at lookup time and not at storage time, which would leave the padded form on the
success page.
