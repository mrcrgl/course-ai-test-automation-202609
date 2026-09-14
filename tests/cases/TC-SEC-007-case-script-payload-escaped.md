---
id: TC-SEC-007
title: A script payload stored in a case file is displayed as text
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
script: tests/scripts/TC-SEC-007.test.js
duration: 0.1s
environment: local-dev
last_reviewed: 2026-09-14
review_interval: 3m
stability: stable
references:
  - id: "#1/AC-10"
    type: acceptance-criterion
    source: https://github.com/mrcrgl/course-ai-test-automation-202609/issues/1
    demand: The literal text <script>alert(1)</script> in the Test Data of TC-SEC-001 is displayed as visible characters and no script executes.
---

# TC-SEC-007 — A script payload stored in a case file is displayed as text

## Objective
Prove the renderer escapes file content instead of trusting it. `TC-SEC-001` keeps a
`<script>` payload in its Test Data, so a renderer that passed markup through would publish
a stored XSS on the very page that documents the defence against it.

## References
| Reference | Type | Source | What it demands |
| --- | --- | --- | --- |
| `#1/AC-10` | Acceptance criterion | Issue #1 — Browse test cases and test runs in a login-gated web UI | The script payload in TC-SEC-001 is displayed as visible characters and no script executes |

## Preconditions
- The application is running at `http://localhost:3000`.
- The client has logged in as `admin` and holds the issued `sid` cookie.
- `tests/cases/TC-SEC-001-username-is-html-escaped.md` contains the literal text `<script>alert(1)</script>`.

## Test Data
| Field | Value |
| --- | --- |
| Path | `/cases/TC-SEC-001` |
| Payload in the file | `<script>alert(1)</script>` |

## Scenario

**Given** the client has logged in as `admin`
**And** the case file holds the literal text `<script>alert(1)</script>` as test data
**When** it requests `/cases/TC-SEC-001`
**Then** the response status is `200`
**And** the body contains the escaped text `&lt;script&gt;alert(1)&lt;/script&gt;`
**And** the body contains no executable `<script>alert(1)</script>` tag
**And** the body contains no `script` element at all

## Expected Result
The payload appears on the page as visible characters. Nothing in the rendered page is
executable.

## Postconditions
- None — the page is read-only and makes no state change.

## Risk & Coverage
| Field | Value |
| --- | --- |
| Core value (BSI-P-01) | Confidentiality, Integrity |
| Elementary threat (BSI-P-02) | G 0.21 Manipulation of hardware or software; G 0.28 Software vulnerabilities or errors |
| Frequency of occurrence (BSI-P-06) | `frequently` — the payloads are permanently in the repository by design, so any renderer regression is exploitable the moment it ships |
| Extent of damage (BSI-P-06) | `considerable` — script running in the page context acts as the logged-in user and can read every page behind the session |
| Risk category (BSI-P-07) | `high` (considerable × frequently) |
| Treatment option (BSI-P-08) | B — Risk reduction: the markdown renderer escapes before it emits and has no raw-HTML path |
| Residual risk | The application sets no Content-Security-Policy, so escaping is the only layer. Writing a case file still requires commit access, which is what keeps the frequency below `very-frequently`. |

## Test Script
Implemented in `tests/scripts/TC-SEC-007.test.js` — run with `npm test`.

```javascript
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { useServer, login, get } = require('./_harness');

const ctx = useServer();

test('TC-SEC-007 — a script payload stored in a case file is displayed as text', async () => {
  const cookie = await login(ctx.base, 'admin', 'admin123');
  const res = await get(`${ctx.base}/cases/TC-SEC-001`, cookie);
  const body = await res.text();

  assert.equal(res.status, 200);
  assert.match(body, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.doesNotMatch(body, /<script>alert\(1\)<\/script>/, 'the payload survived unescaped');
  assert.doesNotMatch(body, /<script/i, 'the page carries an executable script element');
});
```

## Change Log
| Version | Date | Author | Change | Reason |
| --- | --- | --- | --- | --- |
| 1 | 2026-09-14 | marc.riegel@nimbusforge.de | Created | Issue #1 AC-10 requires file content to be escaped before it is displayed |

## Notes
This is the stored counterpart of TC-SEC-001, which covers the reflected case on the login
form. The last assertion — no `script` element anywhere — holds because the browse pages
ship no JavaScript of their own; if that ever changes, this assertion must be narrowed to
the payload rather than relaxed. TC-SEC-008 covers the attribute-context payload.
