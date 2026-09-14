---
id: TC-CI-009
title: The check adds nothing to the application
version: 1
status: approved
owner: marc.riegel@nimbusforge.de
created: 2026-09-14
updated: 2026-09-14
test_level: system
test_type: maintainability
design_technique: checklist-based
priority: medium
suite: regression
frequency: per-commit
automation: automated
script: tests/scripts/TC-CI-009.test.js
duration: 0.1s
environment: local-dev
last_reviewed: 2026-09-14
review_interval: 12m
stability: stable
references:
  - id: "#3/AC-9"
    type: acceptance-criterion
    source: https://github.com/mrcrgl/course-ai-test-automation-202609/issues/3
    demand: package.json gains no runtime dependency, and the application, the case scripts and the validator still run locally exactly as before, with no workflow involved.
---

# TC-CI-009 — The check adds nothing to the application

## Objective
Prove the check is additive only. Continuous integration that quietly becomes a prerequisite —
a dependency the application now needs, a command that only exists in the workflow — has moved
the repository's definition of "run the tests" onto a server.

## References
| Reference | Type | Source | What it demands |
| --- | --- | --- | --- |
| `#3/AC-9` | Acceptance criterion | Issue #3 — Run the test suite on every pull request against master | No runtime dependency is added, and everything still runs locally exactly as before |

## Preconditions
- `package.json` and `.github/workflows/tests.yml` are both present.

## Test Data
| Field | Value |
| --- | --- |
| Expected dependencies | `cookie-parser`, `express` |
| Expected `devDependencies` | none |
| Expected scripts | `start`, `test`, `test:report`, with the commands they already had |
| Refused install commands | `npm install`, `npm add`, `npm i`, `npx` |

## Scenario

**Given** the repository contains `package.json` and the workflow file
**When** both are read
**Then** the runtime dependencies are still `cookie-parser` and `express`
**And** no development dependency was introduced
**And** `start`, `test` and `test:report` still run the commands they ran before
**And** no workflow step installs anything outside the committed lockfile

## Expected Result
The application is untouched: the same two dependencies, the same three commands, and a
workflow that only calls them.

## Postconditions
- None — the case only reads files.

## Risk & Coverage
Not applicable — maintainability case, no threat model entry.

## Test Script
Implemented in `tests/scripts/TC-CI-009.test.js` — run with `npm test`.

```javascript
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { REPO, loadWorkflow, runCommands } = require('./_workflow');

const EXPECTED_SCRIPTS = {
  start: 'node server.js',
  test: 'node --test tests/scripts/*.test.js',
  'test:report': 'node .claude/skills/run-test-cases/scripts/run-tests.js',
};

test('TC-CI-009 — the check adds nothing to the application', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(REPO, 'package.json'), 'utf8'));

  assert.deepEqual(
    Object.keys(pkg.dependencies).sort(),
    ['cookie-parser', 'express'],
    'the application gained a runtime dependency'
  );
  assert.equal(pkg.devDependencies, undefined, 'the check introduced a development dependency');
  assert.deepEqual(
    Object.entries(EXPECTED_SCRIPTS).filter(([name, cmd]) => pkg.scripts[name] !== cmd),
    [],
    'an npm script changed, so the local commands are no longer the ones they were'
  );

  const commands = runCommands(loadWorkflow().doc.jobs.suite);
  assert.deepEqual(
    commands.filter((c) => /\bnpm\s+(install|add|i)\b|\bnpx\b/.test(c)),
    [],
    'a step installs something outside the committed lockfile'
  );
});
```

## Change Log
| Version | Date | Author | Change | Reason |
| --- | --- | --- | --- | --- |
| 1 | 2026-09-14 | marc.riegel@nimbusforge.de | Created | Issue #3 AC-9 requires the check to add nothing to the application |

## Notes
The same constraint is why the TC-CI cases parse the workflow with the small YAML subset
reader in `tests/scripts/_workflow.js` instead of adding a YAML parser as a development
dependency. It understands nested mappings, block and flow sequences, block scalars and
comments, and throws on anything beyond that rather than guessing — if the workflow ever grows
YAML it cannot read, the TC-CI cases fail loudly instead of asserting against a wrong parse.
