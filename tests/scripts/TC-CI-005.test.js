'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadWorkflow } = require('./_workflow');

test('TC-CI-005 — the run report leaves the run as a downloadable artifact', () => {
  const steps = loadWorkflow().doc.jobs.suite.steps;

  const upload = steps.find((s) => String(s.uses).startsWith('actions/upload-artifact'));
  assert.ok(upload, 'no step uploads the run report as an artifact');

  // The step that finds the report the runner wrote and publishes its path for the upload.
  const producer = steps.find((s) => typeof s.run === 'string' && s.run.includes('GITHUB_OUTPUT'));
  assert.ok(
    producer && producer.id && producer.run.includes('tests/runs/'),
    'no step publishes the path of the report the runner wrote under tests/runs/'
  );
  assert.equal(
    upload.with.path,
    `\${{ steps.${producer.id}.outputs.path }}`,
    'the artifact does not upload the report that this run produced'
  );
  assert.match(
    String(upload.with.name),
    /matrix\.node-version/,
    'both matrix jobs would upload under the same artifact name, so one would be rejected'
  );
  assert.ok(
    /!\s*cancelled\(\)/.test(String(upload.if)) && !/success\(\)/.test(String(upload.if)),
    `the upload runs under '${upload.if}' — it must also run when the suite failed, which is ` +
      'exactly when the report is worth reading'
  );
});
