---
id: TC-SEC-005
title: An unknown identifier returns 404 without leaking internals
version: 1
status: approved
owner: marc.riegel@nimbusforge.de
created: 2026-09-14
updated: 2026-09-14
test_level: system
test_type: security
design_technique: error-guessing
priority: medium
suite: security
frequency: per-commit
automation: automated
script: tests/scripts/TC-SEC-005.test.js
duration: 0.1s
environment: local-dev
last_reviewed: 2026-09-14
review_interval: 3m
stability: stable
references:
  - id: "#1/AC-8"
    type: acceptance-criterion
    source: https://github.com/mrcrgl/course-ai-test-automation-202609/issues/1
    demand: A request for a case or run identifier that does not exist returns 404 with no stack trace and no filesystem path in the response.
---

# TC-SEC-005 — An unknown identifier returns 404 without leaking internals

## Objective
Prove that asking for something that is not there produces an ordinary 404 page, not an
unhandled error that tells the client where the application lives on disk.

## References
| Reference | Type | Source | What it demands |
| --- | --- | --- | --- |
| `#1/AC-8` | Acceptance criterion | Issue #1 — Browse test cases and test runs in a login-gated web UI | An unknown identifier returns 404 with no stack trace and no filesystem path |

## Preconditions
- The application is running at `http://localhost:3000`.
- The client has logged in as `admin` and holds the issued `sid` cookie.
- No case `TC-NOPE-999` and no run `2999-12-31T23-59-59Z` exist.

## Test Data
| Field | Value |
| --- | --- |
| Unknown case | `/cases/TC-NOPE-999` |
| Unknown run | `/runs/2999-12-31T23-59-59Z` |

## Scenario

**Given** the client has logged in as `admin`
**When** it requests an unknown case identifier and an unknown run identifier
**Then** both responses have status `404`
**And** neither body contains a stack frame or a source location
**And** neither body contains the absolute path of the repository
**And** neither body contains the underlying filesystem error

## Expected Result
Both requests get a plain not-found page. Nothing in it says where the file was looked for
or what went wrong internally.

## Postconditions
- None — the pages are read-only and make no state change.

## Risk & Coverage
| Field | Value |
| --- | --- |
| Core value (BSI-P-01) | Confidentiality |
| Elementary threat (BSI-P-02) | G 0.19 Disclosure of information that should be protected |
| Frequency of occurrence (BSI-P-06) | `frequently` — provoking error pages to fingerprint a stack is routine reconnaissance |
| Extent of damage (BSI-P-06) | `limited` — what leaks is deployment layout and library versions, useful for a later attack but not itself an entry |
| Risk category (BSI-P-07) | `medium` (limited × frequently) |
| Treatment option (BSI-P-08) | B — Risk reduction: unknown identifiers are answered with an application 404 page instead of being passed to the filesystem |
| Residual risk | The case checks the two browse routes only. TC-UI-005 covers the same property for paths the application does not route at all. |

## Test Script
Implemented in `tests/scripts/TC-SEC-005.test.js` — run with `npm test`.

```javascript
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { useServer, login, get } = require('./_harness');

const ctx = useServer();

const REPO = path.resolve(__dirname, '..', '..');

test('TC-SEC-005 — an unknown identifier returns 404 without leaking internals', async () => {
  const cookie = await login(ctx.base, 'admin', 'admin123');

  for (const p of ['/cases/TC-NOPE-999', '/runs/2999-12-31T23-59-59Z']) {
    const res = await get(`${ctx.base}${p}`, cookie);
    const body = await res.text();

    assert.equal(res.status, 404, `${p} did not return 404`);
    assert.doesNotMatch(body, /at [\w.]+ \(|\.js:\d+:\d+|Error:/, `${p} leaked a stack trace`);
    assert.ok(!body.includes(REPO), `${p} leaked a filesystem path`);
    assert.doesNotMatch(body, /ENOENT|no such file/i, `${p} leaked the underlying error`);
  }
});
```

## Change Log
| Version | Date | Author | Change | Reason |
| --- | --- | --- | --- | --- |
| 1 | 2026-09-14 | marc.riegel@nimbusforge.de | Created | Issue #1 AC-8 requires an unknown identifier to 404 cleanly |

## Notes
The unknown run identifier is well-formed but in the future, so it passes the identifier
check and fails only on the filesystem lookup — the branch where an unhandled `ENOENT`
would surface. The repository path is taken from the test's own location rather than
hard-coded, so the assertion stays true wherever the repository is checked out.
