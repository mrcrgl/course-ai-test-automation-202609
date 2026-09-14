---
id: TC-UI-001
title: The login page renders with all form controls
version: 2
status: approved
owner: marc.riegel@nimbusforge.de
created: 2026-09-14
updated: 2026-09-14
test_level: system
test_type: functional
design_technique: checklist-based
priority: high
suite: smoke
frequency: per-commit
automation: automated
script: tests/scripts/TC-UI-001.test.js
duration: 0.1s
environment: local-dev
last_reviewed: 2026-09-14
review_interval: 12m
stability: stable
references:
  - id: LOGIN-FORM
    type: derived
    source: server.js:25 and views/login.html
    demand: GET / serves the login form with a username field, a password field and a submit button.
---

# TC-UI-001 — The login page renders with all form controls

## Objective
Prove that the entry point of the application serves a usable login form. Every other UI
case assumes this one passes.

## References
| Reference | Type | Source | What it demands |
| --- | --- | --- | --- |
| `LOGIN-FORM` | Derived | `server.js:25`, `views/login.html` | `GET /` serves the login form with both fields and a submit button |

No ticket describes this behaviour, so the reference is `derived` from the route handler
and the template. Replace it with the acceptance criterion once one exists.

## Preconditions
- The application is running at `http://localhost:3000`.
- The client holds no `sid` session cookie.

## Test Data
| Field | Value |
| --- | --- |
| Endpoint | `GET /` |

## Scenario

**Given** the client holds no `sid` session cookie
**When** the client requests `GET /`
**Then** the response status is `200`
**And** the response contains a form with `data-testid="login-form"` posting to `/login`
**And** the response contains an input with `data-testid="username-input"`
**And** the response contains an input with `data-testid="password-input"`
**And** the response contains a button with `data-testid="login-button"`
**And** no element with `data-testid="error-message"` is present

## Expected Result
The login form is displayed in its initial, error-free state.

## Postconditions
- None — the case makes no state change.

## Risk & Coverage
Not applicable — functional case, no threat model entry.

## Test Script
Implemented in `tests/scripts/TC-UI-001.test.js` — run with `npm test`.

```javascript
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { useServer, form, json, login, testid, inputValue } = require('./_harness');

const ctx = useServer();

test('TC-UI-001 — the login page renders with all form controls', async () => {
  const res = await fetch(`${ctx.base}/`, { redirect: 'manual' });
  const body = await res.text();

  assert.equal(res.status, 200);
  assert.match(body, /<form[^>]*method="post"[^>]*action="\/login"[^>]*data-testid="login-form"/);
  assert.match(body, /<input[^>]*data-testid="username-input"/);
  assert.match(body, /<input[^>]*data-testid="password-input"/);
  assert.match(body, /<button[^>]*data-testid="login-button"/);
  assert.doesNotMatch(body, /data-testid="error-message"/);
});
```

## Change Log
| Version | Date | Author | Change | Reason |
| --- | --- | --- | --- | --- |
| 2 | 2026-09-14 | marc.riegel@nimbusforge.de | Migrated to the ISTQB case format and automated | The `write-test-case` skill requires traceability, recurrence metadata and an executable script |
| 1 | 2026-09-14 | marc.riegel@nimbusforge.de | Created | Baseline smoke check for the application entry point |

## Notes
The absence of an error message on a fresh page load matters: `renderLogin` injects the
banner by string replacement into the same template, so a bug there could leave a stale
error visible on the initial page.
