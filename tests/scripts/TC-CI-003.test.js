'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { REPO, loadWorkflow } = require('./_workflow');

test('TC-CI-003 — the suite runs on Node 20 and Node 24, each reporting as its own check', () => {
  const engines = JSON.parse(fs.readFileSync(path.join(REPO, 'package.json'), 'utf8')).engines;
  assert.equal(engines.node, '>=20', 'package.json no longer declares Node 20 as the floor');

  const job = loadWorkflow().doc.jobs.suite;
  const versions = (job.strategy.matrix['node-version'] || []).map(String);

  assert.deepEqual(
    ['20', '24'].filter((v) => !versions.includes(v)),
    [],
    `the matrix runs on ${versions.join(', ') || 'nothing'} — it must cover Node 20 and Node 24`
  );
  assert.match(
    job.name,
    /\$\{\{\s*matrix\.node-version\s*\}\}/,
    'the job name does not carry the Node version, so the two checks cannot be told apart'
  );
  const setup = job.steps.find((s) => String(s.uses).startsWith('actions/setup-node'));
  assert.equal(
    setup && setup.with['node-version'],
    '${{ matrix.node-version }}',
    'the job does not install the Node version its matrix entry names'
  );
  assert.equal(
    job.strategy['fail-fast'],
    false,
    'fail-fast would cancel the other Node version before it reports its own result'
  );
});
