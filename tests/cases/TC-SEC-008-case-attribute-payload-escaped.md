---
id: TC-SEC-008
title: An attribute-breakout payload in a case file is displayed as text
version: 1
status: approved
owner: marc.riegel@nimbusforge.de
created: 2026-09-14
updated: 2026-09-14
test_level: system
test_type: security
design_technique: error-guessing
priority: high
suite: security
frequency: per-commit
automation: automated
script: tests/scripts/TC-SEC-008.test.js
duration: 0.1s
environment: local-dev
last_reviewed: 2026-09-14
review_interval: 3m
stability: stable
references:
  - id: "#1/AC-10"
    type: acceptance-criterion
    source: https://github.com/mrcrgl/course-ai-test-automation-202609/issues/1
    demand: The text "><img src=x onerror=alert(1)> in the Test Data of TC-SEC-003 is displayed as visible characters, and no img element with an onerror handler is present in the rendered markup.
---

# TC-SEC-008 — An attribute-breakout payload in a case file is displayed as text

## Objective
Prove the renderer escapes quotes and angle brackets alike. `TC-SEC-003` keeps an
attribute-breakout payload in its Test Data, which a renderer that escapes only `<` and `>`
would turn into a live `img` element with an event handler.

## References
| Reference | Type | Source | What it demands |
| --- | --- | --- | --- |
| `#1/AC-10` | Acceptance criterion | Issue #1 — Browse test cases and test runs in a login-gated web UI | The attribute-breakout payload in TC-SEC-003 is displayed as characters, with no `img` carrying an `onerror` handler |

## Preconditions
- The application is running at `http://localhost:3000`.
- The client has logged in as `admin` and holds the issued `sid` cookie.
- `tests/cases/TC-SEC-003-attribute-context-escaped.md` contains the literal payload as test data.

## Test Data
| Field | Value |
| --- | --- |
| Path | `/cases/TC-SEC-003` |
| Payload in the file | `"><img src=x onerror=alert(1)>` |

## Scenario

**Given** the client has logged in as `admin`
**And** the case file holds the payload `"><img src=x onerror=alert(1)>` as test data
**When** it requests `/cases/TC-SEC-003`
**Then** the response status is `200`
**And** the body contains the fully escaped text `&quot;&gt;&lt;img src=x onerror=alert(1)&gt;`
**And** the body contains no `img` element carrying an `onerror` handler
**And** the body contains no `img` element at all

## Expected Result
The payload is shown as visible characters, quotes included. No image element and no event
handler appear in the rendered markup.

## Postconditions
- None — the page is read-only and makes no state change.

## Risk & Coverage
| Field | Value |
| --- | --- |
| Core value (BSI-P-01) | Confidentiality, Integrity |
| Elementary threat (BSI-P-02) | G 0.21 Manipulation of hardware or software; G 0.28 Software vulnerabilities or errors |
| Frequency of occurrence (BSI-P-06) | `frequently` — the payload is committed to the repository, so a regression is exploitable as soon as it ships |
| Extent of damage (BSI-P-06) | `considerable` — an `onerror` handler needs no script tag and runs in the page context of a logged-in user |
| Risk category (BSI-P-07) | `high` (considerable × frequently) |
| Treatment option (BSI-P-08) | B — Risk reduction: the renderer escapes `"` and `'` as well as `&`, `<` and `>` |
| Residual risk | No Content-Security-Policy backs the escaping up. The case covers the two payloads that exist in the repository; a new payload shape would need its own case. |

## Test Script
Implemented in `tests/scripts/TC-SEC-008.test.js` — run with `npm test`.

```javascript
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { useServer, login, get } = require('./_harness');

const ctx = useServer();

test('TC-SEC-008 — an attribute-breakout payload in a case file is displayed as text', async () => {
  const cookie = await login(ctx.base, 'admin', 'admin123');
  const res = await get(`${ctx.base}/cases/TC-SEC-003`, cookie);
  const body = await res.text();

  assert.equal(res.status, 200);
  assert.match(body, /&quot;&gt;&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.doesNotMatch(body, /<img[^>]*onerror/i, 'an img element with an onerror handler is present');
  assert.doesNotMatch(body, /<img/i, 'the page carries an img element');
});
```

## Change Log
| Version | Date | Author | Change | Reason |
| --- | --- | --- | --- | --- |
| 1 | 2026-09-14 | marc.riegel@nimbusforge.de | Created | Issue #1 AC-10 names this payload explicitly alongside the script-tag one |

## Notes
Split from TC-SEC-007 for the same reason TC-SEC-003 is split from TC-SEC-001: the two
payloads exercise different characters of the escape, and an implementation that handles
angle brackets but not quotes passes one and fails the other.
