'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { REPO } = require('./_workflow');

const VALIDATOR = '.claude/skills/write-test-case/scripts/validate-cases.sh';
const CASE = 'TC-AUTH-003-login-wrong-password.md';
const SCRIPT = 'tests/scripts/TC-AUTH-003.test.js';

/**
 * A miniature repository holding the validator and one conformant case, so a malformed file
 * can be validated without touching this repository's own cases. The validator locates the
 * repository from its own path, which is why the skill's directory layout is reproduced.
 */
function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tc-ci-004-'));
  for (const dir of [path.dirname(VALIDATOR), 'tests/cases', 'tests/scripts']) {
    fs.mkdirSync(path.join(root, dir), { recursive: true });
  }
  for (const file of [VALIDATOR, `tests/cases/${CASE}`, SCRIPT]) {
    fs.copyFileSync(path.join(REPO, file), path.join(root, file));
  }
  fs.writeFileSync(path.join(root, 'tests/cases/README.md'), `| [TC-AUTH-003](${CASE}) |\n`);
  return root;
}

function validate(root) {
  const r = spawnSync('bash', [path.join(root, VALIDATOR), '--strict'], { encoding: 'utf8' });
  return { status: r.status, output: `${r.stdout}${r.stderr}` };
}

/** Applies one malformation to a fresh fixture and validates it. */
function malform(rel, edit) {
  const root = fixture();
  const file = path.join(root, rel);
  fs.writeFileSync(file, edit(fs.readFileSync(file, 'utf8')));
  return validate(root);
}

test('TC-CI-004 — a malformed case file fails the validator step', () => {
  const clean = validate(fixture());
  assert.equal(clean.status, 0, `the fixture is malformed before anything is changed:\n${clean.output}`);

  // `version: 7` against a change log that still has one row.
  const rows = malform(`tests/cases/${CASE}`, (t) => t.replace(/^version: \d+$/m, 'version: 7'));
  // The inline copy of the script no longer matches the file it claims to reproduce.
  const drift = malform(SCRIPT, (t) => `${t}\n// edited without updating the case file\n`);
  // A required front-matter key is gone.
  const missing = malform(`tests/cases/${CASE}`, (t) => t.replace(/^priority: .*\n/m, ''));

  assert.match(
    rows.output,
    new RegExp(`FAIL ${CASE}: version is 7 but the change log has \\d+ row`),
    `a version disagreeing with the change log was not reported against ${CASE}:\n${rows.output}`
  );
  assert.match(
    drift.output,
    new RegExp(`FAIL ${CASE}: inline ## Test Script differs from ${SCRIPT}`),
    `an inline script differing from the file on disk was not reported:\n${drift.output}`
  );
  assert.match(
    missing.output,
    new RegExp(`FAIL ${CASE}: missing front-matter key 'priority'`),
    `a missing front-matter key was not reported:\n${missing.output}`
  );
  assert.deepEqual(
    [rows.status, drift.status, missing.status],
    [1, 1, 1],
    'a malformed case file did not exit non-zero, so the validator step would not fail the job'
  );
});
