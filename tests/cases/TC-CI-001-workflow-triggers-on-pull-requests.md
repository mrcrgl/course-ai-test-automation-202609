---
id: TC-CI-001
title: The check starts on every pull request against master
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
script: tests/scripts/TC-CI-001.test.js
duration: 0.1s
environment: local-dev
last_reviewed: 2026-09-14
review_interval: 6m
stability: stable
references:
  - id: "#3/AC-1"
    type: acceptance-criterion
    source: https://github.com/mrcrgl/course-ai-test-automation-202609/issues/3
    demand: A pull request against master starts a workflow run when it is opened, updated with a new commit or reopened, and a push to master starts one too.
---

# TC-CI-001 — The check starts on every pull request against master

## Objective
Prove that nobody has to remember to ask for the check. The workflow's trigger declaration
is what makes a run start on its own, and it is the one part of the pipeline that a
repository can check without waiting for GitHub to act.

## References
| Reference | Type | Source | What it demands |
| --- | --- | --- | --- |
| `#3/AC-1` | Acceptance criterion | Issue #3 — Run the test suite on every pull request against master | A run starts unrequested for a pull request against `master` — opened, updated or reopened — and for every push to `master` |

## Preconditions
- The repository contains `.github/workflows/tests.yml`.
- No GitHub API access is needed: the trigger declaration is part of the repository.

## Test Data
| Field | Value |
| --- | --- |
| Workflow | `.github/workflows/tests.yml` |
| Keys read | `on.pull_request.branches`, `on.pull_request.types`, `on.push.branches` |
| Expected base branch | `master` |
| Expected pull-request events | `opened`, `synchronize`, `reopened` |

## Scenario

**Given** the repository contains the workflow file `.github/workflows/tests.yml`
**When** its trigger declaration is read
**Then** the workflow declares a `pull_request` trigger
**And** that trigger is limited to the base branch `master`
**And** it fires when a pull request is opened, updated with a new commit, or reopened
**And** a push to `master` starts a run as well

## Expected Result
The workflow is configured to run by itself for exactly the events the criterion names: any
pull request targeting `master`, and any push to `master`.

## Postconditions
- None — the case only reads files.

## Risk & Coverage
Not applicable — functional case, no threat model entry.

## Test Script
Implemented in `tests/scripts/TC-CI-001.test.js` — run with `npm test`.

```javascript
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { WORKFLOW_PATH, REPO, loadWorkflow } = require('./_workflow');

test('TC-CI-001 — the workflow starts on pull requests against master and on pushes to master', () => {
  assert.ok(fs.existsSync(path.join(REPO, WORKFLOW_PATH)), `${WORKFLOW_PATH} does not exist`);

  const { on } = loadWorkflow().doc;

  assert.ok(on && on.pull_request, 'the workflow declares no pull_request trigger');
  assert.deepEqual(
    on.pull_request.branches,
    ['master'],
    'the pull_request trigger is not limited to the base branch master'
  );
  // Omitting `types` is GitHub's way of asking for exactly these three, so either is correct.
  const types = on.pull_request.types || ['opened', 'synchronize', 'reopened'];
  assert.deepEqual(
    ['opened', 'synchronize', 'reopened'].filter((t) => !types.includes(t)),
    [],
    'a pull request opened, updated with a new commit or reopened would not start a run'
  );
  assert.deepEqual(
    (on.push || {}).branches,
    ['master'],
    'a push to master does not start a run'
  );
});
```

## Change Log
| Version | Date | Author | Change | Reason |
| --- | --- | --- | --- | --- |
| 1 | 2026-09-14 | marc.riegel@nimbusforge.de | Created | Issue #3 AC-1 requires a run to start without anyone requesting it |

## Notes
Omitting `types` from a `pull_request` trigger is GitHub's shorthand for exactly
`opened`, `synchronize` and `reopened`, so the case accepts either form.

Whether GitHub actually starts the run is GitHub's behaviour, not this repository's content;
the issue records a real run on the pull request as the evidence for that half. This case
covers what can be proved here: that the declaration asking for it is present and correct.
