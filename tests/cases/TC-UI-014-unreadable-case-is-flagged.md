---
id: TC-UI-014
title: An unreadable case file is flagged, not dropped
version: 1
status: approved
owner: marc.riegel@nimbusforge.de
created: 2026-09-14
updated: 2026-09-14
test_level: system
test_type: reliability
design_technique: error-guessing
priority: medium
suite: regression
frequency: per-commit
automation: automated
script: tests/scripts/TC-UI-014.test.js
duration: 0.1s
environment: local-dev
last_reviewed: 2026-09-14
review_interval: 6m
stability: stable
references:
  - id: "#1/AC-12"
    type: acceptance-criterion
    source: https://github.com/mrcrgl/course-ai-test-automation-202609/issues/1
    demand: A case file with missing or unparsable front matter leaves /cases at 200, still listing the remaining cases, with the malformed file shown as unreadable rather than omitted silently.
---

# TC-UI-014 — An unreadable case file is flagged, not dropped

## Objective
Prove one broken file cannot take the index down or disappear from it: the readable cases
are still listed, and the broken one is visibly marked unreadable.

## References
| Reference | Type | Source | What it demands |
| --- | --- | --- | --- |
| `#1/AC-12` | Acceptance criterion | Issue #1 — Browse test cases and test runs in a login-gated web UI | A malformed case leaves the list at 200, keeps the others, and is shown as unreadable |

## Preconditions
- The application is running at `http://localhost:3000`.
- The client has logged in as `admin` and holds the issued `sid` cookie.
- `TESTS_DIR` points at a fixture directory holding two valid cases and one file with no front matter.

## Test Data
| Field | Value |
| --- | --- |
| Valid cases | `TC-AUTH-003-login-wrong-password.md`, `TC-UI-001-login-page-renders.md` |
| Malformed case | `TC-BAD-001-no-front-matter.md` — a heading and a line of prose, no front matter |
| Path | `/cases` |

## Scenario

**Given** the client has logged in as `admin`
**And** the case directory holds two valid cases and one file with no front matter
**When** it requests `/cases`
**Then** the response status is `200`
**And** both valid cases are listed and linked
**And** the malformed file is marked as unreadable
**And** the malformed file is named on the page
**And** the listing holds one row per file, including the malformed one

## Expected Result
The index degrades to "this file is unreadable" for the broken case and keeps working for
the rest.

## Postconditions
- The fixture directory stays in the temporary directory; `TESTS_DIR` is restored.

## Risk & Coverage
Not applicable — reliability case, no threat model entry.

## Test Script
Implemented in `tests/scripts/TC-UI-014.test.js` — run with `npm test`.

```javascript
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { useServer, login, get } = require('./_harness');

const ctx = useServer();

const CASE_DIR = path.join(__dirname, '..', 'cases');
const GOOD = ['TC-AUTH-003-login-wrong-password.md', 'TC-UI-001-login-page-renders.md'];

test('TC-UI-014 — an unreadable case file is flagged, not dropped', async () => {
  const cookie = await login(ctx.base, 'admin', 'admin123');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tc-ui-014-'));
  fs.mkdirSync(path.join(dir, 'cases'));
  fs.mkdirSync(path.join(dir, 'runs'));
  for (const file of GOOD) {
    fs.copyFileSync(path.join(CASE_DIR, file), path.join(dir, 'cases', file));
  }
  fs.writeFileSync(
    path.join(dir, 'cases', 'TC-BAD-001-no-front-matter.md'),
    '# TC-BAD-001 — this file never got its front matter\n\nJust prose.\n'
  );

  const previous = process.env.TESTS_DIR;
  process.env.TESTS_DIR = dir;
  try {
    const res = await get(`${ctx.base}/cases`, cookie);
    const body = await res.text();

    assert.equal(res.status, 200);
    assert.match(body, /<a href="\/cases\/TC-AUTH-003"/);
    assert.match(body, /<a href="\/cases\/TC-UI-001"/);
    assert.match(body, /data-testid="case-unreadable"/);
    assert.match(body, /TC-BAD-001-no-front-matter\.md/);
    assert.equal((body.match(/data-testid="case-row"/g) || []).length, GOOD.length + 1);
  } finally {
    if (previous === undefined) delete process.env.TESTS_DIR;
    else process.env.TESTS_DIR = previous;
  }
});
```

## Change Log
| Version | Date | Author | Change | Reason |
| --- | --- | --- | --- | --- |
| 1 | 2026-09-14 | marc.riegel@nimbusforge.de | Created | Issue #1 AC-12 requires a malformed file to be visible rather than silently skipped |

## Notes
Silently skipping the file would be the tempting implementation, and it is the dangerous
one: a case that vanishes from the index is a case nobody notices has stopped being run.
The valid fixtures are copies of real case files, so the case also proves the listing still
parses correct files while one is broken.
