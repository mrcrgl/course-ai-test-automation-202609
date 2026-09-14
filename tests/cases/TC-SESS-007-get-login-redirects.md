---
id: TC-SESS-007
title: GET /login redirects to the login page instead of 404
version: 2
status: approved
owner: marc.riegel@nimbusforge.de
created: 2026-09-14
updated: 2026-09-14
test_level: system
test_type: usability
design_technique: use-case
priority: low
suite: regression
frequency: per-commit
automation: automated
script: tests/scripts/TC-SESS-007.test.js
duration: 0.1s
environment: local-dev
last_reviewed: 2026-09-14
review_interval: 12m
stability: stable
references:
  - id: BSI-P-13
    type: bsi-practice
    source: BSI-Standard 200-3 §7 — User friendliness of security safeguards
    demand: Safeguards must be tolerant towards user and operating errors.
---

# TC-SESS-007 — GET /login redirects to the login page instead of 404

## Objective
Prove that arriving at `/login` by GET — browser back button, a bookmark, a resubmitted
history entry — lands the user on the form rather than on an error.

## References
| Reference | Type | Source | What it demands |
| --- | --- | --- | --- |
| `BSI-P-13` | BSI practice | 200-3 §7 — User friendliness | Safeguards must tolerate user and operating errors |

## Preconditions
- The application is running at `http://localhost:3000`.

## Test Data
| Field | Value |
| --- | --- |
| Endpoint | `GET /login` |

## Scenario

**Given** the application is running
**When** the client requests `GET /login`
**Then** the response status is `302` with `Location: /`
**And** the response status is not `404`
**And** following the redirect displays the login form

## Expected Result
`/login` is a usable entry point for GET and resolves to the login form.

## Postconditions
- None — the case makes no state change.

## Risk & Coverage
Not applicable — usability case, no threat model entry.

## Test Script
Implemented in `tests/scripts/TC-SESS-007.test.js` — run with `npm test`.

```javascript
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { useServer, form, json, login, testid, inputValue } = require('./_harness');

const ctx = useServer();

test('TC-SESS-007 — GET /login redirects to the login page instead of 404', async () => {
  const res = await fetch(`${ctx.base}/login`, { redirect: 'manual' });

  assert.equal(res.status, 302);
  assert.equal(res.headers.get('location'), '/');
  assert.notEqual(res.status, 404);

  const page = await fetch(`${ctx.base}/`, { redirect: 'manual' });
  assert.match(await page.text(), /data-testid="login-form"/);
});
```

## Change Log
| Version | Date | Author | Change | Reason |
| --- | --- | --- | --- | --- |
| 2 | 2026-09-14 | marc.riegel@nimbusforge.de | Migrated to the ISTQB case format and automated | The `write-test-case` skill requires traceability, recurrence metadata and an executable script |
| 1 | 2026-09-14 | marc.riegel@nimbusforge.de | Created | A bookmarked or back-button `/login` should not error |

## Notes
Contrast with TC-UI-005: an unmapped path *should* 404. `/login` is different because it is
a real endpoint that simply does not serve GET, and users reach it by ordinary browser
behaviour.
