---
id: TC-UI-003
title: The static stylesheet is served
version: 2
status: approved
owner: marc.riegel@nimbusforge.de
created: 2026-09-14
updated: 2026-09-14
test_level: integration
test_type: functional
design_technique: checklist-based
priority: low
suite: regression
frequency: per-commit
automation: automated
script: tests/scripts/TC-UI-003.test.js
duration: 0.1s
environment: local-dev
last_reviewed: 2026-09-14
review_interval: 12m
stability: stable
references:
  - id: STATIC-ASSETS
    type: derived
    source: server.js:19
    demand: express.static serves the contents of public/ at the web root.
---

# TC-UI-003 — The static stylesheet is served

## Objective
Prove the static asset middleware is mounted and reachable, so both pages render styled
rather than as unstyled markup.

## References
| Reference | Type | Source | What it demands |
| --- | --- | --- | --- |
| `STATIC-ASSETS` | Derived | `server.js:19` | `express.static` serves `public/` at the web root |

## Preconditions
- The application is running at `http://localhost:3000`.

## Test Data
| Field | Value |
| --- | --- |
| Endpoint | `GET /style.css` |

## Scenario

**Given** the application is running
**When** the client requests `GET /style.css`
**Then** the response status is `200`
**And** the `Content-Type` header begins with `text/css`
**And** the response body is not empty

## Expected Result
The stylesheet referenced by the login and success pages loads.

## Postconditions
- None — the case makes no state change.

## Risk & Coverage
Not applicable — functional case, no threat model entry.

## Test Script
Implemented in `tests/scripts/TC-UI-003.test.js` — run with `npm test`.

```javascript
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { useServer, form, json, login, testid, inputValue } = require('./_harness');

const ctx = useServer();

test('TC-UI-003 — the static stylesheet is served', async () => {
  const res = await fetch(`${ctx.base}/style.css`);
  const body = await res.text();

  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /^text\/css/);
  assert.ok(body.length > 0, 'stylesheet body is empty');
});
```

## Change Log
| Version | Date | Author | Change | Reason |
| --- | --- | --- | --- | --- |
| 2 | 2026-09-14 | marc.riegel@nimbusforge.de | Migrated to the ISTQB case format and automated | The `write-test-case` skill requires traceability, recurrence metadata and an executable script |
| 1 | 2026-09-14 | marc.riegel@nimbusforge.de | Created | Guards against a broken static path after refactoring |

## Notes
Low priority by BSI-P-14: a broken stylesheet is cosmetic, so the case earns its place only
because it is cheap. If it ever becomes slow or flaky, drop it rather than maintain it.
