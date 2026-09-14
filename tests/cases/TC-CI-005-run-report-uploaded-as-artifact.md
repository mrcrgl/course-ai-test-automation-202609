---
id: TC-CI-005
title: The run report is attached to the run as a downloadable artifact
version: 1
status: approved
owner: marc.riegel@nimbusforge.de
created: 2026-09-14
updated: 2026-09-14
test_level: system
test_type: functional
design_technique: checklist-based
priority: medium
suite: regression
frequency: per-commit
automation: automated
script: tests/scripts/TC-CI-005.test.js
duration: 0.1s
environment: local-dev
last_reviewed: 2026-09-14
review_interval: 6m
stability: stable
references:
  - id: "#3/AC-6"
    type: acceptance-criterion
    source: https://github.com/mrcrgl/course-ai-test-automation-202609/issues/3
    demand: The report the runner wrote under tests/runs/ is uploaded as a build artifact, downloadable from the run, whether the job passed or failed.
---

# TC-CI-005 — The run report is attached to the run as a downloadable artifact

## Objective
Prove the evidence the runner produces survives the runner. The report exists only on the
virtual machine that wrote it, so unless it is uploaded — including, and especially, when the
suite failed — it is gone when the job ends.

## References
| Reference | Type | Source | What it demands |
| --- | --- | --- | --- |
| `#3/AC-6` | Acceptance criterion | Issue #3 — Run the test suite on every pull request against master | The report written under `tests/runs/` is uploaded as an artifact of the run, pass or fail |

## Preconditions
- The workflow defines a `suite` job whose steps include the recorded run.

## Test Data
| Field | Value |
| --- | --- |
| Upload action | `actions/upload-artifact` |
| Uploaded path | the step output published by the step that locates the report |
| Artifact name | must contain `matrix.node-version` |
| Upload condition | must hold `!cancelled()` and must not be `success()` |

## Scenario

**Given** the workflow defines the `suite` job
**When** its artifact handling is read
**Then** a step uploads an artifact with `actions/upload-artifact`
**And** an earlier step publishes the path of the report the runner wrote under `tests/runs/`
**And** the artifact uploads exactly that path
**And** the artifact name carries the Node version, so both matrix jobs upload their own report
**And** the upload runs whether the suite passed or failed, and is skipped only when the run is cancelled

## Expected Result
Each matrix job attaches its own run report to the run, downloadable afterwards, regardless of
the verdict.

## Postconditions
- None — the case only reads files.

## Risk & Coverage
Not applicable — functional case, no threat model entry.

## Test Script
Implemented in `tests/scripts/TC-CI-005.test.js` — run with `npm test`.

```javascript
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadWorkflow } = require('./_workflow');

test('TC-CI-005 — the run report leaves the run as a downloadable artifact', () => {
  const steps = loadWorkflow().doc.jobs.suite.steps;

  const upload = steps.find((s) => String(s.uses).startsWith('actions/upload-artifact'));
  assert.ok(upload, 'no step uploads the run report as an artifact');

  // The step that finds the report the runner wrote and publishes its path for the upload.
  const producer = steps.find((s) => typeof s.run === 'string' && s.run.includes('GITHUB_OUTPUT'));
  assert.ok(
    producer && producer.id && producer.run.includes('tests/runs/'),
    'no step publishes the path of the report the runner wrote under tests/runs/'
  );
  assert.equal(
    upload.with.path,
    `\${{ steps.${producer.id}.outputs.path }}`,
    'the artifact does not upload the report that this run produced'
  );
  assert.match(
    String(upload.with.name),
    /matrix\.node-version/,
    'both matrix jobs would upload under the same artifact name, so one would be rejected'
  );
  assert.ok(
    /!\s*cancelled\(\)/.test(String(upload.if)) && !/success\(\)/.test(String(upload.if)),
    `the upload runs under '${upload.if}' — it must also run when the suite failed, which is ` +
      'exactly when the report is worth reading'
  );
});
```

## Change Log
| Version | Date | Author | Change | Reason |
| --- | --- | --- | --- | --- |
| 1 | 2026-09-14 | marc.riegel@nimbusforge.de | Created | Issue #3 AC-6 requires the report to be attached to the run rather than committed |

## Notes
`if: success()` on the upload would satisfy a casual reading of the criterion and quietly
discard every report worth reading, which is why the condition itself is asserted.
TC-CI-006 covers the other half of AC-6 — the verdict in the job summary — and
TC-CI-007 covers the requirement that the report is never committed back.
