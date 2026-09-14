---
id: TC-SEC-009
title: Browsing the pages never writes to the test directories
version: 1
status: approved
owner: marc.riegel@nimbusforge.de
created: 2026-09-14
updated: 2026-09-14
test_level: system
test_type: security
design_technique: checklist-based
priority: medium
suite: security
frequency: per-commit
automation: automated
script: tests/scripts/TC-SEC-009.test.js
duration: 0.3s
environment: local-dev
last_reviewed: 2026-09-14
review_interval: 3m
stability: stable
references:
  - id: "#1/AC-13"
    type: acceptance-criterion
    source: https://github.com/mrcrgl/course-ai-test-automation-202609/issues/1
    demand: However often the four pages are requested, no file under tests/ is created, modified or deleted.
---

# TC-SEC-009 — Browsing the pages never writes to the test directories

## Objective
Prove the feature is genuinely read-only. The files under `tests/` are the specifications
and the recorded evidence; a page that rewrote, cached or touched one of them would be
altering the record it exists to display.

## References
| Reference | Type | Source | What it demands |
| --- | --- | --- | --- |
| `#1/AC-13` | Acceptance criterion | Issue #1 — Browse test cases and test runs in a login-gated web UI | No file under `tests/` is created, modified or deleted by any number of requests |

## Preconditions
- The application is running at `http://localhost:3000`.
- The client has logged in as `admin` and holds the issued `sid` cookie.
- `tests/` holds the case files, the scripts and at least one run report.

## Test Data
| Field | Value |
| --- | --- |
| Paths | `/cases`, `/cases/TC-AUTH-003`, `/runs`, `/runs/<newest run id>` |
| Repetitions | 3 rounds over all four paths |
| Snapshot | every file under `tests/`, by size and modification time |

## Scenario

**Given** the client has logged in as `admin`
**And** a snapshot of every file under `tests/` with its size and modification time
**When** it requests all four pages three times over
**Then** every request returns `200`
**And** the set of files under `tests/` is unchanged
**And** no file's size or modification time has changed

## Expected Result
The directory is byte-for-byte as it was: nothing added, nothing removed, nothing touched.

## Postconditions
- None — that is precisely what the case asserts.

## Risk & Coverage
| Field | Value |
| --- | --- |
| Core value (BSI-P-01) | Integrity |
| Elementary threat (BSI-P-02) | G 0.22 Manipulation of information |
| Frequency of occurrence (BSI-P-06) | `rarely` — a read path writes only when a change introduces a cache, a counter or a "last viewed" marker |
| Extent of damage (BSI-P-06) | `considerable` — a run report altered after the fact stops being evidence, and nothing in the report would say it had changed |
| Risk category (BSI-P-07) | `medium` (considerable × rarely) |
| Treatment option (BSI-P-08) | A — Risk avoidance: the feature has no write path at all, rather than a guarded one |
| Residual risk | Size and mtime detect an overwrite, not a write that restores both. Content hashing would close that gap and is not warranted for a demo application. |

## Test Script
Implemented in `tests/scripts/TC-SEC-009.test.js` — run with `npm test`.

```javascript
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { useServer, login, get } = require('./_harness');

const ctx = useServer();

const TESTS = path.join(__dirname, '..');

/** Every file under tests/, with the size and mtime that identify its content. */
function snapshot(dir) {
  const out = {};
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) Object.assign(out, snapshot(full));
    else {
      const s = fs.statSync(full);
      out[path.relative(TESTS, full)] = `${s.size}:${s.mtimeMs}`;
    }
  }
  return out;
}

test('TC-SEC-009 — browsing the pages never writes to the test directories', async () => {
  const cookie = await login(ctx.base, 'admin', 'admin123');
  const newest = fs
    .readdirSync(path.join(TESTS, 'runs'))
    .filter((f) => /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z\.md$/.test(f))
    .sort()
    .pop()
    .slice(0, -3);
  const paths = ['/cases', '/cases/TC-AUTH-003', '/runs', `/runs/${newest}`];

  const before = snapshot(TESTS);

  for (let i = 0; i < 3; i++) {
    for (const p of paths) {
      assert.equal((await get(`${ctx.base}${p}`, cookie)).status, 200, `${p} did not render`);
    }
  }

  const after = snapshot(TESTS);
  assert.deepEqual(Object.keys(after), Object.keys(before), 'a file appeared or disappeared');
  assert.deepEqual(after, before, 'a file under tests/ was modified');
});
```

## Change Log
| Version | Date | Author | Change | Reason |
| --- | --- | --- | --- | --- |
| 1 | 2026-09-14 | marc.riegel@nimbusforge.de | Created | Issue #1 AC-13 requires the feature to leave the filesystem untouched |

## Notes
The case runs alongside the rest of the suite, which does not write under `tests/` either —
the two cases that need a mutated directory build it in the system temporary directory.
`npm run test:report` writes its report after the whole suite has finished, so it cannot
race this snapshot.
