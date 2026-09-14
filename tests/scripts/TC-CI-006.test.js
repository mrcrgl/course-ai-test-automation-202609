'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { REPO, loadWorkflow } = require('./_workflow');

/** The newest recorded run report, repo-relative. */
function newestReport() {
  const file = fs
    .readdirSync(path.join(REPO, 'tests', 'runs'))
    .filter((f) => /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z\.md$/.test(f))
    .sort()
    .pop();
  return `tests/runs/${file}`;
}

test('TC-CI-006 — the verdict and the case counts appear in the job summary', () => {
  const step = loadWorkflow().doc.jobs.suite.steps.find(
    (s) => typeof s.run === 'string' && s.run.includes('GITHUB_STEP_SUMMARY')
  );
  assert.ok(step, 'no step writes anything to the job summary');

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tc-ci-006-'));
  const report = newestReport();
  const summary = path.join(dir, 'summary.md');
  const output = path.join(dir, 'output.txt');
  fs.writeFileSync(path.join(dir, 'suite.log'), `PASS  of 51 case(s)  ->  ${report}\n`);
  fs.writeFileSync(summary, '');
  fs.writeFileSync(output, '');

  // GitHub expands ${{ ... }} before the shell sees the script; the only expression in this
  // step is the matrix Node version, so a concrete version stands in for it here.
  const script = step.run.replace(/\$\{\{[^}]*\}\}/g, '24');
  const run = spawnSync('bash', ['-c', script], {
    cwd: REPO,
    encoding: 'utf8',
    env: {
      ...process.env,
      RUNNER_TEMP: dir,
      GITHUB_STEP_SUMMARY: summary,
      GITHUB_OUTPUT: output,
    },
  });
  assert.equal(run.status, 0, `the summary step failed:\n${run.stdout}${run.stderr}`);

  const published = fs.readFileSync(summary, 'utf8');
  const recorded = fs.readFileSync(path.join(REPO, report), 'utf8');
  const verdict = recorded.match(/^\*\*(?:PASS|FAIL)\*\*.*$/m)[0];

  assert.ok(published.includes(verdict), `the job summary does not carry the verdict line:\n${published}`);
  assert.deepEqual(
    ['Cases available', 'Executed', 'Passed', 'Failed', 'Skipped'].filter(
      (metric) => !published.includes(`| ${metric} |`)
    ),
    [],
    `the job summary does not carry the case counts:\n${published}`
  );
  assert.match(
    published,
    /artifact/,
    'the job summary does not say where the full report can be downloaded'
  );
  assert.match(
    fs.readFileSync(output, 'utf8'),
    new RegExp(`^path=${report}$`, 'm'),
    'the step does not hand the report path to the upload step'
  );
});
