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
