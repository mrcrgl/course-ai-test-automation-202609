---
id: TC-SEC-003
title: A quote in the username cannot break out of the value attribute
version: 1
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
script: tests/scripts/TC-SEC-003.test.js
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

# TC-SEC-003 — A quote in the username cannot break out of the value attribute

## Objective
Prove the double quote is escaped as well as the angle brackets. The username is reflected
*inside* an HTML attribute, so a bare `"` would end the attribute and let the rest of the
payload become markup.

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
| Username | `"><img src=x onerror=alert(1)>` |
| Password | `x` |

## Scenario

**Given** the client holds no `sid` session cookie
**And** the user has entered the username `"><img src=x onerror=alert(1)>`
**When** the user submits the login form
**Then** the response status is `401`
**And** the body contains no `img` tag carrying an `onerror` handler
**And** the payload appears fully escaped as `value="&quot;&gt;&lt;img src=x onerror=alert(1)&gt;"`
**And** exactly one username input element is present in the response

## Expected Result
The quote is escaped to `&quot;`, the payload stays inside the attribute, and the document
structure is unchanged.

## Postconditions
- No session is created; no state changes.

## Risk & Coverage
| Field | Value |
| --- | --- |
| Core value (BSI-P-01) | Confidentiality, Integrity |
| Elementary threat (BSI-P-02) | G 0.21 Manipulation of hardware or software; G 0.43 Importing messages |
| Frequency of occurrence (BSI-P-06) | `very-frequently` — attribute breakout is in every XSS payload list |
| Extent of damage (BSI-P-06) | `considerable` — an `onerror` handler executes without the victim clicking anything |
| Risk category (BSI-P-07) | `very-high` (considerable × very-frequently) |
| Treatment option (BSI-P-08) | B — Risk reduction: `escapeHtml` covers `"` and `'` as well as `&`, `<` and `>` |
| Residual risk | As TC-SEC-001: no Content-Security-Policy, so escaping is the only layer. |

## Test Script
Implemented in `tests/scripts/TC-SEC-003.test.js` — run with `npm test`.

```javascript
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { useServer, form, json, login, testid, inputValue } = require('./_harness');

const ctx = useServer();

test('TC-SEC-003 — a quote in the username cannot break out of the value attribute', async () => {
  const payload = '"><img src=x onerror=alert(1)>';
  const res = await fetch(`${ctx.base}/login`, form({ username: payload, password: 'x' }));
  const body = await res.text();

  assert.equal(res.status, 401);
  assert.doesNotMatch(body, /<img[^>]*onerror/i, 'an img tag escaped into the markup');
  assert.match(body, /value="&quot;&gt;&lt;img src=x onerror=alert\(1\)&gt;"/);

  // The username input must still be a single well-formed tag.
  const inputs = body.match(/<input[^>]*data-testid="username-input"[^>]*>/g);
  assert.equal(inputs.length, 1);
});
```

## Change Log
| Version | Date | Author | Change | Reason |
| --- | --- | --- | --- | --- |
| 1 | 2026-09-14 | marc.riegel@nimbusforge.de | Created | Promoted from a "repeat with" note in TC-SEC-001 to a case of its own, per one case, one behaviour |

## Notes
Split from TC-SEC-001 deliberately. An `escapeHtml` that handled `<` and `>` but not `"` —
a common partial implementation — would pass TC-SEC-001 and fail here. Element context and
attribute context are two aspects of the same threat, and BSI-P-11 requires both.

The element-count assertion guards the structural failure directly: if the quote escaped,
the injected `>` would close the input tag and a second one would appear in the markup.
