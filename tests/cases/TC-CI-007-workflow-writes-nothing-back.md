---
id: TC-CI-007
title: The workflow may only read the repository and writes nothing back
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
script: tests/scripts/TC-CI-007.test.js
duration: 0.1s
environment: local-dev
last_reviewed: 2026-09-14
review_interval: 3m
stability: stable
references:
  - id: "#3/AC-6"
    type: acceptance-criterion
    source: https://github.com/mrcrgl/course-ai-test-automation-202609/issues/3
    demand: The workflow commits nothing and pushes nothing - tests/runs/ in the repository is left exactly as the author committed it - and contents: read is all the token it needs.
---

# TC-CI-007 — The workflow may only read the repository and writes nothing back

## Objective
Prove the check cannot alter what it is checking. A job that can write to the repository can
rewrite the record it exists to produce, and a token that can write is a token a malicious
pull request would like to borrow.

## References
| Reference | Type | Source | What it demands |
| --- | --- | --- | --- |
| `#3/AC-6` | Acceptance criterion | Issue #3 — Run the test suite on every pull request against master | The workflow commits and pushes nothing; `tests/runs/` stays exactly as the author committed it, and `contents: read` is enough |

## Preconditions
- The repository contains `.github/workflows/tests.yml`.

## Test Data
| Field | Value |
| --- | --- |
| Expected permissions | `contents: read`, and nothing else |
| Refused commands | `git push`, `git commit`, `git add`, `git tag` |
| Allowed actions | anything under `actions/` |
| Secrets | none referenced |

## Scenario

**Given** the repository contains the workflow file
**When** its permissions, its steps and the actions it uses are read
**Then** the workflow token is limited to `contents: read`
**And** the job does not grant itself more than the workflow does
**And** no step runs a git command that would write to the repository
**And** every action it uses comes from the first-party `actions/` organisation
**And** the workflow reads no secret

## Expected Result
The run can read the code, run the suite and upload an artifact. It cannot commit, push, tag
or reach a secret, so a report it produces can never end up in the repository's history.

## Postconditions
- None — the case only reads files.

## Risk & Coverage
| Field | Value |
| --- | --- |
| Core value (BSI-P-01) | Integrity |
| Elementary threat (BSI-P-02) | G 0.22 Manipulation of information |
| Frequency of occurrence (BSI-P-06) | `rarely` — the workflow only gains write access when somebody edits it, typically to make CI "helpfully" commit something |
| Extent of damage (BSI-P-06) | `considerable` — a run report committed by the job that produced it stops being independent evidence, and a write token on a pull-request trigger is a well-known path to repository takeover |
| Risk category (BSI-P-07) | `medium` (considerable × rarely) |
| Treatment option (BSI-P-08) | A — Risk avoidance: the job is never granted write access in the first place, rather than being trusted not to use it |
| Residual risk | The case reads the workflow's declarations; it does not prove GitHub honours them. A third-party action added under a future `uses:` would be caught, but a compromised `actions/*` release would not. |

## Test Script
Implemented in `tests/scripts/TC-CI-007.test.js` — run with `npm test`.

```javascript
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadWorkflow, runCommands } = require('./_workflow');

// Commands that would write the repository's own history or content back from a runner.
const WRITES_BACK = [/\bgit\s+push\b/, /\bgit\s+commit\b/, /\bgit\s+add\b/, /\bgit\s+tag\b/];

test('TC-CI-007 — the workflow may only read the repository and writes nothing back to it', () => {
  const { doc } = loadWorkflow();
  const job = doc.jobs.suite;

  assert.deepEqual(
    doc.permissions,
    { contents: 'read' },
    'the workflow token is not restricted to reading the repository'
  );
  assert.equal(
    job.permissions,
    undefined,
    'the job grants itself permissions beyond the read-only workflow token'
  );

  const commands = runCommands(job).join('\n');
  assert.deepEqual(
    WRITES_BACK.filter((pattern) => pattern.test(commands)).map(String),
    [],
    'a step runs a command that would write to the repository — the run report is evidence ' +
      'of a commit and must not be committed by the job that produced it'
  );

  const thirdParty = job.steps
    .filter((s) => s.uses)
    .map((s) => String(s.uses))
    .filter((uses) => !uses.startsWith('actions/'));
  assert.deepEqual(
    thirdParty,
    [],
    'the job uses an action outside the first-party actions/ organisation, which would run ' +
      'unreviewed code against the checkout'
  );

  assert.doesNotMatch(
    loadWorkflow().text,
    /secrets\./,
    'the workflow reads a secret; it needs none, and a fork pull request would not have it'
  );
});
```

## Change Log
| Version | Date | Author | Change | Reason |
| --- | --- | --- | --- | --- |
| 1 | 2026-09-14 | marc.riegel@nimbusforge.de | Created | Issue #3 AC-6 requires the workflow to commit nothing, and the ticket's constraints require least privilege |

## Notes
`git switch -C` appears in the workflow and is deliberately not on the refused list: it moves
a local branch pointer on the runner's own checkout so the report records a branch name rather
than `HEAD`, and it writes nothing anybody else can see.
