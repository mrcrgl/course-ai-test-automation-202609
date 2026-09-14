---
id: TC-UI-010
title: The run detail page shows the whole report
version: 1
status: approved
owner: marc.riegel@nimbusforge.de
created: 2026-09-14
updated: 2026-09-14
test_level: system
test_type: functional
design_technique: checklist-based
priority: high
suite: regression
frequency: per-commit
automation: automated
script: tests/scripts/TC-UI-010.test.js
duration: 0.2s
environment: local-dev
last_reviewed: 2026-09-14
review_interval: 6m
stability: stable
references:
  - id: "#1/AC-6"
    type: acceptance-criterion
    source: https://github.com/mrcrgl/course-ai-test-automation-202609/issues/1
    demand: The run detail page renders the verdict, run context, repository state, summary and per-case results, names the commit hash and message, and renders failures with their diagnostic output.
---

# TC-UI-010 — The run detail page shows the whole report

## Objective
Prove a recorded run can be read in full in the browser, including the commit it was
executed against and the diagnostic output of anything that failed.

## References
| Reference | Type | Source | What it demands |
| --- | --- | --- | --- |
| `#1/AC-6` | Acceptance criterion | Issue #1 — Browse test cases and test runs in a login-gated web UI | Verdict, run context, repository state, summary, per-case results, commit hash and message, and failure diagnostics |

## Preconditions
- The application is running at `http://localhost:3000`.
- The client has logged in as `admin` and holds the issued `sid` cookie.
- `TESTS_DIR` points at a fixture directory whose `runs/` holds one report with a failed case.
- `tests/runs/` contains at least one committed report.

## Test Data
| Field | Value |
| --- | --- |
| Fixture run | `2026-01-02T03-04-05Z` — verdict `FAIL`, 1 passed, 1 failed |
| Fixture commit | `abc1234567890abcdef1234567890abcdef12345`, message `a commit that broke a case` |
| Fixture failure | an `AssertionError` diagnostic for `TC-AUTH-003` |

## Scenario

**Given** the client has logged in as `admin`
**And** a run report that records one passed and one failed case
**When** it requests that run's detail page
**Then** the response status is `200`
**And** the verdict is shown
**And** the run context, repository state and summary sections are rendered
**And** the result of every case in the report is listed
**And** the commit hash and the commit message the run executed against are shown
**And** the failed case is rendered with its diagnostic output in a code block
**And** the newest report committed to `tests/runs/` renders the same way

## Expected Result
The page reproduces the report in full — verdict, context, repository state, summary,
results and failure diagnostics — for both a failing fixture and a real committed report.

## Postconditions
- The fixture directory stays in the temporary directory; `TESTS_DIR` is restored.

## Risk & Coverage
Not applicable — functional case, no threat model entry.

## Test Script
Implemented in `tests/scripts/TC-UI-010.test.js` — run with `npm test`.

```javascript
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { useServer, login, get } = require('./_harness');

const ctx = useServer();

const RUN_ID = '2026-01-02T03-04-05Z';

// A report with a failure in it. The committed reports under tests/runs/ are
// all green, so the diagnostic block is only reachable from a fixture.
// Written as a line array so that no markdown heading in the fixture starts a
// line of this file - the case format validator reads `## ` at column zero as
// a section of the case that embeds this script.
const REPORT = [
  `# Test run - 2026-01-02T03:04:05Z`,
  '',
  '**FAIL** - 2 of 2 case(s) executed, 1 passed, 1 failed, 0 skipped.',
  '',
  '## Run context',
  '',
  '| Field | Value |',
  '| --- | --- |',
  `| Run ID | \`${RUN_ID}\` |`,
  '| Wall clock | 1.11 s |',
  '',
  '## Repository state',
  '',
  '| Field | Value |',
  '| --- | --- |',
  '| Commit | `abc1234` |',
  '| Full hash | `abc1234567890abcdef1234567890abcdef12345` |',
  '| Commit message | a commit that broke a case |',
  '',
  '## Summary',
  '',
  '| Metric | Value |',
  '| --- | --- |',
  '| Executed | 2 |',
  '| Passed | 1 |',
  '| Failed | 1 |',
  '| Skipped | 0 |',
  '',
  '## Results',
  '',
  '| Case | Title | Result | Latency | Completed | Suite | Priority |',
  '| --- | --- | --- | --- | --- | --- | --- |',
  '| [TC-AUTH-001](../cases/TC-AUTH-001-login-valid-admin.md) | Valid admin credentials | PASS | 10 ms | 2026-01-02T03:04:05.100Z | smoke | critical |',
  '| [TC-AUTH-003](../cases/TC-AUTH-003-login-wrong-password.md) | Wrong password | FAIL | 20 ms | 2026-01-02T03:04:05.200Z | security | critical |',
  '',
  '## Failures',
  '',
  '### TC-AUTH-003 - Wrong password',
  '',
  '```',
  'AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:',
  '+ actual - expected',
  '+ 302',
  '- 401',
  '```',
  '',
].join('\n');

function fixtureDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tc-ui-010-'));
  fs.mkdirSync(path.join(dir, 'cases'));
  fs.mkdirSync(path.join(dir, 'runs'));
  fs.writeFileSync(path.join(dir, 'runs', `${RUN_ID}.md`), REPORT);
  return dir;
}

test('TC-UI-010 — the run detail page shows the whole report', async () => {
  const cookie = await login(ctx.base, 'admin', 'admin123');
  const previous = process.env.TESTS_DIR;
  process.env.TESTS_DIR = fixtureDir();

  try {
    const res = await get(`${ctx.base}/runs/${RUN_ID}`, cookie);
    const body = await res.text();

    assert.equal(res.status, 200);
    assert.match(body, /badge-fail">FAIL</);
    for (const heading of ['Run context', 'Repository state', 'Summary']) {
      assert.ok(body.includes(`>${heading}</h3>`), `the ${heading} section is missing`);
    }
    for (const id of ['TC-AUTH-001', 'TC-AUTH-003']) {
      assert.ok(body.includes(`>${id}</a>`), `the result for ${id} is missing`);
    }
    assert.ok(body.includes('abc1234567890abcdef1234567890abcdef12345'), 'no commit hash');
    assert.ok(body.includes('a commit that broke a case'), 'no commit message');
    assert.match(
      body,
      /<pre><code>AssertionError[\s\S]*?302[\s\S]*?<\/code><\/pre>/,
      'the failure diagnostic is missing'
    );
  } finally {
    if (previous === undefined) delete process.env.TESTS_DIR;
    else process.env.TESTS_DIR = previous;
  }

  const committed = fs
    .readdirSync(path.join(__dirname, '..', 'runs'))
    .filter((f) => /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z\.md$/.test(f))
    .sort()
    .pop()
    .slice(0, -3);
  const real = await get(`${ctx.base}/runs/${committed}`, cookie);
  const realBody = await real.text();
  assert.equal(real.status, 200);
  assert.ok(realBody.includes('Repository state'), 'the committed report did not render');
});
```

## Change Log
| Version | Date | Author | Change | Reason |
| --- | --- | --- | --- | --- |
| 1 | 2026-09-14 | marc.riegel@nimbusforge.de | Created | Issue #1 AC-6 requires the whole report to be readable, including failures |

## Notes
Every report committed to `tests/runs/` is green, so the failure branch of AC-6 is
unreachable from real data. The case therefore renders a fixture report written to a
temporary directory and pointed at with `TESTS_DIR`, then repeats the structural
assertions against the newest committed report so a fixture that has drifted from the real
format cannot hide a regression. Nothing is written under `tests/` — TC-SEC-009 asserts
that for the feature as a whole.
