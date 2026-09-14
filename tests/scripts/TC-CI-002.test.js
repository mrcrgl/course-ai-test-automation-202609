'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { REPO, loadWorkflow, runCommands } = require('./_workflow');

const VALIDATOR = '.claude/skills/write-test-case/scripts/validate-cases.sh --strict';

test('TC-CI-002 — the workflow runs the suite the way the repository defines it', () => {
  assert.ok(
    fs.existsSync(path.join(REPO, 'package-lock.json')),
    'package-lock.json is not committed, so npm ci has nothing to install from'
  );

  const { doc } = loadWorkflow();
  const job = doc.jobs.suite;
  const commands = runCommands(job);
  const find = (needle) => commands.findIndex((c) => c.includes(needle));

  const install = find('npm ci');
  const suite = find('npm run test:report');
  const validator = find(VALIDATOR);

  assert.ok(install >= 0, 'no step installs dependencies with npm ci');
  assert.ok(suite >= 0, 'no step executes the case scripts through npm run test:report');
  assert.ok(validator >= 0, `no step runs the case-format validator: ${VALIDATOR}`);
  assert.ok(install < suite, 'dependencies are installed after the suite has already run');
  assert.deepEqual(
    job.steps.filter((s) => s['continue-on-error'] === true).map((s) => s.name),
    [],
    'a step tolerates its own failure, so a non-zero exit would not fail the job'
  );
  assert.deepEqual(
    [install, suite, validator].filter((i) => /\|\|\s*true|set \+e/.test(commands[i])),
    [],
    'a step discards the exit code of the command it runs'
  );
  // A piped command only fails the step when the shell sets pipefail, which `shell: bash` does.
  assert.ok(
    !commands[suite].includes('|') || doc.defaults.run.shell === 'bash',
    'the suite command is piped but the job does not use `shell: bash`, so a failing suite ' +
      'on the left of the pipe would be reported as success'
  );
});
