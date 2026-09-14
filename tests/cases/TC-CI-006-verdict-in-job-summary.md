---
id: TC-CI-006
title: The verdict and the case counts appear in the job summary
version: 1
status: approved
owner: marc.riegel@nimbusforge.de
created: 2026-09-14
updated: 2026-09-14
test_level: system
test_type: functional
design_technique: use-case
priority: medium
suite: regression
frequency: per-commit
automation: automated
script: tests/scripts/TC-CI-006.test.js
duration: 0.1s
environment: local-dev
last_reviewed: 2026-09-14
review_interval: 6m
stability: stable
references:
  - id: "#3/AC-6"
    type: acceptance-criterion
    source: https://github.com/mrcrgl/course-ai-test-automation-202609/issues/3
    demand: The verdict line and the case counts appear in the job summary, readable without downloading anything.
---

# TC-CI-006 — The verdict and the case counts appear in the job summary

## Objective
Prove that the answer a reviewer actually wants — did it pass, and how many cases ran — is on
the page the check links to, rather than inside an artifact they have to download and open.

## References
| Reference | Type | Source | What it demands |
| --- | --- | --- | --- |
| `#3/AC-6` | Acceptance criterion | Issue #3 — Run the test suite on every pull request against master | The verdict line and the case counts are readable in the job summary without downloading the report |

## Preconditions
- The workflow has a step that writes to `$GITHUB_STEP_SUMMARY`.
- At least one recorded report exists under `tests/runs/`, to stand in for the one CI writes.
- `bash` is available: the step's own shell script is what gets executed.

## Test Data
| Field | Value |
| --- | --- |
| Report | the newest file in `tests/runs/` |
| Runner log | a single line ending in that report's path, as the runner prints it |
| Expanded expression | `${{ matrix.node-version }}` resolved to `24` |
| Expected counts | `Cases available`, `Executed`, `Passed`, `Failed`, `Skipped` |

## Scenario

**Given** the workflow's job-summary step and the newest recorded run report
**When** the step's shell script is executed against that report, with its matrix expression resolved
**Then** the step exits `0`
**And** the job summary carries the report's verdict line verbatim
**And** it carries the case counts from the report's Summary section
**And** it names the artifact the full report can be downloaded from
**And** it hands the report path to the upload step as a step output

## Expected Result
The summary page of the check shows PASS or FAIL, the counts behind it, and where to get the
whole report — without anything being downloaded.

## Postconditions
- None beyond a temporary directory holding the emulated runner environment.

## Risk & Coverage
Not applicable — functional case, no threat model entry.

## Test Script
Implemented in `tests/scripts/TC-CI-006.test.js` — run with `npm test`.

```javascript
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { REPO, loadWorkflow } = require('./_workflow');

/** The newest recorded run report, repo-relative. */
function newestReport() {
  const file = fs
    .readdirSync(path.join(REPO, 'tests', 'runs'))
    .filter((f) => /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z\.md$/.test(f))
    .sort()
    .pop();
  return `tests/runs/${file}`;
}

test('TC-CI-006 — the verdict and the case counts appear in the job summary', () => {
  const step = loadWorkflow().doc.jobs.suite.steps.find(
    (s) => typeof s.run === 'string' && s.run.includes('GITHUB_STEP_SUMMARY')
  );
  assert.ok(step, 'no step writes anything to the job summary');

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tc-ci-006-'));
  const report = newestReport();
  const summary = path.join(dir, 'summary.md');
  const output = path.join(dir, 'output.txt');
  fs.writeFileSync(path.join(dir, 'suite.log'), `PASS  of 51 case(s)  ->  ${report}\n`);
  fs.writeFileSync(summary, '');
  fs.writeFileSync(output, '');

  // GitHub expands ${{ ... }} before the shell sees the script; the only expression in this
  // step is the matrix Node version, so a concrete version stands in for it here.
  const script = step.run.replace(/\$\{\{[^}]*\}\}/g, '24');
  const run = spawnSync('bash', ['-c', script], {
    cwd: REPO,
    encoding: 'utf8',
    env: {
      ...process.env,
      RUNNER_TEMP: dir,
      GITHUB_STEP_SUMMARY: summary,
      GITHUB_OUTPUT: output,
    },
  });
  assert.equal(run.status, 0, `the summary step failed:\n${run.stdout}${run.stderr}`);

  const published = fs.readFileSync(summary, 'utf8');
  const recorded = fs.readFileSync(path.join(REPO, report), 'utf8');
  const verdict = recorded.match(/^\*\*(?:PASS|FAIL)\*\*.*$/m)[0];

  assert.ok(published.includes(verdict), `the job summary does not carry the verdict line:\n${published}`);
  assert.deepEqual(
    ['Cases available', 'Executed', 'Passed', 'Failed', 'Skipped'].filter(
      (metric) => !published.includes(`| ${metric} |`)
    ),
    [],
    `the job summary does not carry the case counts:\n${published}`
  );
  assert.match(
    published,
    /artifact/,
    'the job summary does not say where the full report can be downloaded'
  );
  assert.match(
    fs.readFileSync(output, 'utf8'),
    new RegExp(`^path=${report}$`, 'm'),
    'the step does not hand the report path to the upload step'
  );
});
```

## Change Log
| Version | Date | Author | Change | Reason |
| --- | --- | --- | --- | --- |
| 1 | 2026-09-14 | marc.riegel@nimbusforge.de | Created | Issue #3 AC-6 requires the verdict and counts to be readable without downloading the report |

## Notes
This case runs the step's script rather than reading the workflow for the right words in it.
GitHub expands `${{ ... }}` before the shell ever sees the script, so the case does the same
substitution — the one expression in that step is the matrix Node version. What it cannot
emulate is GitHub's rendering of the summary file; that the markdown lands on the check page
is evidenced by a real run linked from the pull request.
