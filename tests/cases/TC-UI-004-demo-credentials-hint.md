---
id: TC-UI-004
title: The login page shows the demo credentials hint
version: 2
status: approved
owner: marc.riegel@nimbusforge.de
created: 2026-09-14
updated: 2026-09-14
test_level: system
test_type: functional
design_technique: checklist-based
priority: low
suite: regression
frequency: release
automation: automated
script: tests/scripts/TC-UI-004.test.js
duration: 0.1s
environment: local-dev
last_reviewed: 2026-09-14
review_interval: 6m
stability: stable
references:
  - id: DEMO-HINT
    type: derived
    source: views/login.html — the paragraph with class "hint"
    demand: The login page names a working demo account so a course participant can log in unaided.
---

# TC-UI-004 — The login page shows the demo credentials hint

## Objective
Prove the page still names a working demo account, so someone using this app as a test
target can log in without reading the source.

## References
| Reference | Type | Source | What it demands |
| --- | --- | --- | --- |
| `DEMO-HINT` | Derived | `views/login.html`, `.hint` paragraph | The page names a working demo account |

## Preconditions
- The application is running at `http://localhost:3000`.

## Test Data
| Field | Value |
| --- | --- |
| Expected hint | `Demo credentials: admin / admin123` |

## Scenario

**Given** the application is running
**When** the client requests `GET /`
**Then** the page contains a paragraph with class `hint`
**And** the hint text contains `Demo credentials`
**And** it names the username `admin`
**And** it names the password `admin123`

## Expected Result
A tester can read valid credentials directly from the login page.

## Postconditions
- None — the case makes no state change.

## Risk & Coverage
Not applicable — functional case, no threat model entry.

## Test Script
Implemented in `tests/scripts/TC-UI-004.test.js` — run with `npm test`.

```javascript
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { useServer, form, json, login, testid, inputValue } = require('./_harness');

const ctx = useServer();

test('TC-UI-004 — the login page shows the demo credentials hint', async () => {
  const body = await (await fetch(`${ctx.base}/`)).text();
  const hint = body.match(/<p class="hint">([\s\S]*?)<\/p>/);

  assert.ok(hint, 'no hint paragraph on the login page');
  assert.match(hint[1], /Demo credentials/);
  assert.match(hint[1], /admin/);
  assert.match(hint[1], /admin123/);
});
```

## Change Log
| Version | Date | Author | Change | Reason |
| --- | --- | --- | --- | --- |
| 2 | 2026-09-14 | marc.riegel@nimbusforge.de | Migrated to the ISTQB case format and automated | The `write-test-case` skill requires traceability, recurrence metadata and an executable script |
| 1 | 2026-09-14 | marc.riegel@nimbusforge.de | Created | The hint is part of the demo app's purpose as a teaching target |

## Notes
Publishing credentials on the login page would be a critical defect in a production system.
It is correct here only because the app is a disposable test target — this case pins that
deliberate choice so nobody "fixes" it by accident, and so the choice stays visible.

If this application is ever used for anything real, this case must be deleted, the hint
removed, and the static credentials in `server.js:9` replaced.
