---
id: TC-CI-008
title: A run superseded by a newer commit is cancelled
version: 1
status: approved
owner: marc.riegel@nimbusforge.de
created: 2026-09-14
updated: 2026-09-14
test_level: system
test_type: functional
design_technique: checklist-based
priority: low
suite: regression
frequency: per-commit
automation: automated
script: tests/scripts/TC-CI-008.test.js
duration: 0.1s
environment: local-dev
last_reviewed: 2026-09-14
review_interval: 12m
stability: stable
references:
  - id: "#3/AC-7"
    type: acceptance-criterion
    source: https://github.com/mrcrgl/course-ai-test-automation-202609/issues/3
    demand: When a new commit is pushed to a pull request, the run still in progress for it is cancelled, and only the newest run reports a result.
---

# TC-CI-008 — A run superseded by a newer commit is cancelled

## Objective
Prove the repository asks for supersession. Without a concurrency group, a pull request pushed
three times reports three results, and the one that finishes last is not necessarily the one
describing the newest commit.

## References
| Reference | Type | Source | What it demands |
| --- | --- | --- | --- |
| `#3/AC-7` | Acceptance criterion | Issue #3 — Run the test suite on every pull request against master | A new commit cancels the run in progress, so only the newest run reports |

## Preconditions
- The repository contains `.github/workflows/tests.yml`.

## Test Data
| Field | Value |
| --- | --- |
| Group | `${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}` |
| `cancel-in-progress` | `true` |

## Scenario

**Given** the repository contains the workflow file
**When** its concurrency declaration is read
**Then** the workflow declares a concurrency group
**And** `cancel-in-progress` is on
**And** the group names the pull request, so one pull request never cancels another
**And** it falls back to the git ref, for a push where there is no pull-request number
**And** it is scoped to this workflow, so a future workflow does not share the group

## Expected Result
Pushing again to a pull request cancels the run still working on the previous commit, and the
check on the pull request reports the newest run only.

## Postconditions
- None — the case only reads files.

## Risk & Coverage
Not applicable — functional case, no threat model entry.

## Test Script
Implemented in `tests/scripts/TC-CI-008.test.js` — run with `npm test`.

```javascript
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadWorkflow } = require('./_workflow');

test('TC-CI-008 — a run superseded by a newer commit is cancelled', () => {
  const concurrency = loadWorkflow().doc.concurrency;

  assert.ok(concurrency, 'the workflow declares no concurrency group, so runs pile up');
  assert.equal(
    concurrency['cancel-in-progress'],
    true,
    'an in-progress run is not cancelled when a newer commit arrives'
  );
  assert.match(
    String(concurrency.group),
    /github\.event\.pull_request\.number/,
    'the group does not name the pull request, so one pull request would cancel another'
  );
  assert.match(
    String(concurrency.group),
    /github\.ref/,
    'the group has no fallback for a push, where there is no pull request number'
  );
  assert.match(
    String(concurrency.group),
    /github\.workflow/,
    'the group is not scoped to this workflow, so a future workflow would cancel these runs'
  );
});
```

## Change Log
| Version | Date | Author | Change | Reason |
| --- | --- | --- | --- | --- |
| 1 | 2026-09-14 | marc.riegel@nimbusforge.de | Created | Issue #3 AC-7 requires an in-progress run to be cancelled when a newer commit arrives |

## Notes
Cancellation itself is GitHub's behaviour; the pull request links a run cancelled by a
follow-up push as the evidence for it. What is checkable here is the declaration that asks for
it, and in particular that the group is neither too broad (one pull request cancelling another)
nor too narrow (a per-commit group, which would never cancel anything).
