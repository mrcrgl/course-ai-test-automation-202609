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
