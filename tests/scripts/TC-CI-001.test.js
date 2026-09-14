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
