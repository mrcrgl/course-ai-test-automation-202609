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
