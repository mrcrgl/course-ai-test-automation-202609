---
id: TC-SEC-001
title: A script tag in the username is escaped, not executed
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
script: tests/scripts/TC-SEC-001.test.js
duration: 0.1s
environment: local-dev
last_reviewed: 2026-09-14
review_interval: 3m
stability: stable
references:
  - id: BSI-P-11
    type: bsi-practice
    source: BSI-Standard 200-3 §7 — Suitability of security safeguards
    demand: All aspects of the relevant threat must be covered in full.
---

# TC-SEC-001 — A script tag in the username is escaped, not executed

## Objective
Prove that markup submitted as a username is rendered as literal text when echoed back, so
an attacker cannot inject executable script into the login page (reflected XSS).

## References
| Reference | Type | Source | What it demands |
| --- | --- | --- | --- |
| `BSI-P-11` | BSI practice | 200-3 §7 — Suitability | All aspects of the threat covered in full |

## Preconditions
- The application is running at `http://localhost:3000`.
- The client holds no `sid` session cookie.

## Test Data
| Field | Value |
| --- | --- |
| Username | `<script>alert(1)</script>` |
| Password | `x` |

## Scenario

**Given** the client holds no `sid` session cookie
**And** the user has entered the username `<script>alert(1)</script>`
**When** the user submits the login form
**Then** the response status is `401`
**And** the body contains the escaped text `&lt;script&gt;alert(1)&lt;/script&gt;`
**And** the body contains no executable `<script>alert(1)</script>` tag
**And** the escaped payload appears as the value of the username input

## Expected Result
The injected markup is rendered as literal text inside the username field. No script
executes.

## Postconditions
- No session is created; no state changes.

## Risk & Coverage
| Field | Value |
| --- | --- |
| Core value (BSI-P-01) | Confidentiality, Integrity |
| Elementary threat (BSI-P-02) | G 0.21 Manipulation of hardware or software; G 0.43 Importing messages |
| Frequency of occurrence (BSI-P-06) | `very-frequently` — reflected-XSS probing is standard on any form that echoes input |
| Extent of damage (BSI-P-06) | `considerable` — executing script in the page context can harvest credentials as they are typed |
| Risk category (BSI-P-07) | `very-high` (considerable × very-frequently) |
| Treatment option (BSI-P-08) | B — Risk reduction: `escapeHtml` at `server.js:106` is the safeguard |
| Residual risk | Only the username is echoed, so only it is covered. The app sets no Content-Security-Policy, so escaping is the sole defence — there is no second layer if it fails. |

## Test Script
Implemented in `tests/scripts/TC-SEC-001.test.js` — run with `npm test`.

```javascript
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { useServer, form, json, login, testid, inputValue } = require('./_harness');

const ctx = useServer();

test('TC-SEC-001 — a script tag in the username is escaped, not executed', async () => {
  const payload = '<script>alert(1)</script>';
  const res = await fetch(`${ctx.base}/login`, form({ username: payload, password: 'x' }));
  const body = await res.text();

  assert.equal(res.status, 401);
  assert.match(body, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.doesNotMatch(body, /<script>alert\(1\)<\/script>/, 'the payload survived unescaped');
  assert.equal(inputValue(body, 'username-input'), '&lt;script&gt;alert(1)&lt;/script&gt;');
});
```

## Change Log
| Version | Date | Author | Change | Reason |
| --- | --- | --- | --- | --- |
| 2 | 2026-09-14 | marc.riegel@nimbusforge.de | Migrated to the ISTQB case format and automated | The `write-test-case` skill requires traceability, risk classification and an executable script |
| 1 | 2026-09-14 | marc.riegel@nimbusforge.de | Created | The username is reflected into the page after a failed login |

## Notes
This case covers element context only. The attribute-context breakout that the original
case listed as a "repeat with" variation is now TC-SEC-003, per the one-case-one-behaviour
rule — the two payloads exercise different characters of `escapeHtml` and a partial
implementation could pass one and fail the other.

Verified to fail when the character class in `escapeHtml` at `server.js:106` is emptied.
