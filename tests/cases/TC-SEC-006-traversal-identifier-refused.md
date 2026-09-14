---
id: TC-SEC-006
title: A traversal identifier cannot read outside the test directories
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
script: tests/scripts/TC-SEC-006.test.js
duration: 0.2s
environment: local-dev
last_reviewed: 2026-09-14
review_interval: 3m
stability: stable
references:
  - id: "#1/AC-9"
    type: acceptance-criterion
    source: https://github.com/mrcrgl/course-ai-test-automation-202609/issues/1
    demand: An identifier containing path traversal returns 404 or 400 and serves no content from outside tests/cases/ and tests/runs/.
---

# TC-SEC-006 — A traversal identifier cannot read outside the test directories

## Objective
Prove the identifier in the URL is never used to address a file directly: an encoded `../`
walks nowhere, and the application source, its manifest and its templates stay unreadable.

## References
| Reference | Type | Source | What it demands |
| --- | --- | --- | --- |
| `#1/AC-9` | Acceptance criterion | Issue #1 — Browse test cases and test runs in a login-gated web UI | A traversal identifier returns 404 or 400 and serves nothing from outside the two content directories |

## Preconditions
- The application is running at `http://localhost:3000`.
- The client has logged in as `admin` and holds the issued `sid` cookie.
- `server.js`, `package.json`, `views/login.html` and `README.md` exist outside `tests/`.

## Test Data
| Field | Value |
| --- | --- |
| Payload 1 | `/cases/..%2F..%2Fserver.js` |
| Payload 2 | `/cases/%2e%2e%2f%2e%2e%2fpackage.json` |
| Payload 3 | `/runs/..%2F..%2Fpackage.json` |
| Payload 4 | `/runs/..%2F..%2Fviews%2Flogin.html` |
| Payload 5 | `/runs/..%2F..%2FREADME` — the route appends `.md`, so this one names a file that exists |

## Scenario

**Given** the client has logged in as `admin`
**When** it requests each percent-encoded traversal identifier
**Then** every response status is `404` or `400`
**And** no response contains application source code
**And** no response contains the package manifest
**And** no response contains a view template
**And** no response contains a document from outside `tests/`

## Expected Result
Every traversal attempt is refused by the identifier check before any file is opened, and
nothing from outside `tests/cases/` and `tests/runs/` reaches the client.

## Postconditions
- None — the pages are read-only and make no state change.

## Risk & Coverage
| Field | Value |
| --- | --- |
| Core value (BSI-P-01) | Confidentiality |
| Elementary threat (BSI-P-02) | G 0.19 Disclosure of information that should be protected |
| Frequency of occurrence (BSI-P-06) | `very-frequently` — traversal payloads are in the default wordlist of every automated scanner |
| Extent of damage (BSI-P-06) | `considerable` — this application keeps its credentials in `server.js`, so reading one source file is enough to log in as any user |
| Risk category (BSI-P-07) | `very-high` (considerable × very-frequently) |
| Treatment option (BSI-P-08) | B — Risk reduction: identifiers are matched against a fixed pattern, and the run route additionally checks that the resolved file is a direct child of `tests/runs/` |
| Residual risk | The payloads are percent-encoded so the client cannot normalise them away; a proxy that decodes and re-normalises before forwarding would mask a regression here. |

## Test Script
Implemented in `tests/scripts/TC-SEC-006.test.js` — run with `npm test`.

```javascript
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { useServer, login, get } = require('./_harness');

const ctx = useServer();

// Encoded, so the client cannot normalise the traversal away before it is sent.
const TRAVERSALS = [
  '/cases/..%2F..%2Fserver.js',
  '/cases/%2e%2e%2f%2e%2e%2fpackage.json',
  '/runs/..%2F..%2Fpackage.json',
  '/runs/..%2F..%2Fviews%2Flogin.html',
  '/runs/..%2F..%2FREADME', // the route appends `.md`, so this one addresses a real file
];

test('TC-SEC-006 — a traversal identifier cannot read outside the test directories', async () => {
  const cookie = await login(ctx.base, 'admin', 'admin123');

  for (const p of TRAVERSALS) {
    const res = await get(`${ctx.base}${p}`, cookie);
    const body = await res.text();

    assert.ok([400, 404].includes(res.status), `${p} returned ${res.status}`);
    assert.doesNotMatch(body, /SESSION_COOKIE|cookie-parser|require\(/, `${p} served source`);
    assert.doesNotMatch(body, /"dependencies"|"llm-testing"/, `${p} served package.json`);
    assert.doesNotMatch(body, /data-testid="login-form"/, `${p} served a view template`);
    assert.doesNotMatch(body, /Login demo app|## Credentials/, `${p} served a document outside tests/`);
  }
});
```

## Change Log
| Version | Date | Author | Change | Reason |
| --- | --- | --- | --- | --- |
| 1 | 2026-09-14 | marc.riegel@nimbusforge.de | Created | Issue #1 AC-9 requires identifiers to be unable to escape the content directories |

## Notes
The payloads are sent percent-encoded on purpose: `fetch` resolves a literal `../` in a URL
before the request leaves the client, so an unencoded payload would test the client's URL
parser rather than the server.

Payload 5 is the one with teeth. The run route appends `.md` to the identifier, so the
first four payloads name files that do not exist and would 404 even with no identifier
check at all; `..%2F..%2FREADME` resolves to the repository's own `README.md`. Verified to
fail when the `isRunId` pattern and the containment check in `lib/content.js` are both
removed. Damage is rated `considerable` because the static credential
list lives in `server.js` — in an application with a real credential store, reading one
source file would rate lower.
