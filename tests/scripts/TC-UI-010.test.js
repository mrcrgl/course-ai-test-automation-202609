'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { useServer, login, get } = require('./_harness');

const ctx = useServer();

const RUN_ID = '2026-01-02T03-04-05Z';

// A report with a failure in it. The committed reports under tests/runs/ are
// all green, so the diagnostic block is only reachable from a fixture.
// Written as a line array so that no markdown heading in the fixture starts a
// line of this file - the case format validator reads `## ` at column zero as
// a section of the case that embeds this script.
const REPORT = [
  `# Test run - 2026-01-02T03:04:05Z`,
  '',
  '**FAIL** - 2 of 2 case(s) executed, 1 passed, 1 failed, 0 skipped.',
  '',
  '## Run context',
  '',
  '| Field | Value |',
  '| --- | --- |',
  `| Run ID | \`${RUN_ID}\` |`,
  '| Wall clock | 1.11 s |',
  '',
  '## Repository state',
  '',
  '| Field | Value |',
  '| --- | --- |',
  '| Commit | `abc1234` |',
  '| Full hash | `abc1234567890abcdef1234567890abcdef12345` |',
  '| Commit message | a commit that broke a case |',
  '',
  '## Summary',
  '',
  '| Metric | Value |',
  '| --- | --- |',
  '| Executed | 2 |',
  '| Passed | 1 |',
  '| Failed | 1 |',
  '| Skipped | 0 |',
  '',
  '## Results',
  '',
  '| Case | Title | Result | Latency | Completed | Suite | Priority |',
  '| --- | --- | --- | --- | --- | --- | --- |',
  '| [TC-AUTH-001](../cases/TC-AUTH-001-login-valid-admin.md) | Valid admin credentials | PASS | 10 ms | 2026-01-02T03:04:05.100Z | smoke | critical |',
  '| [TC-AUTH-003](../cases/TC-AUTH-003-login-wrong-password.md) | Wrong password | FAIL | 20 ms | 2026-01-02T03:04:05.200Z | security | critical |',
  '',
  '## Failures',
  '',
  '### TC-AUTH-003 - Wrong password',
  '',
  '```',
  'AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:',
  '+ actual - expected',
  '+ 302',
  '- 401',
  '```',
  '',
].join('\n');

function fixtureDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tc-ui-010-'));
  fs.mkdirSync(path.join(dir, 'cases'));
  fs.mkdirSync(path.join(dir, 'runs'));
  fs.writeFileSync(path.join(dir, 'runs', `${RUN_ID}.md`), REPORT);
  return dir;
}

test('TC-UI-010 — the run detail page shows the whole report', async () => {
  const cookie = await login(ctx.base, 'admin', 'admin123');
  const previous = process.env.TESTS_DIR;
  process.env.TESTS_DIR = fixtureDir();

  try {
    const res = await get(`${ctx.base}/runs/${RUN_ID}`, cookie);
    const body = await res.text();

    assert.equal(res.status, 200);
    assert.match(body, /badge-fail">FAIL</);
    for (const heading of ['Run context', 'Repository state', 'Summary']) {
      assert.ok(body.includes(`>${heading}</h3>`), `the ${heading} section is missing`);
    }
    for (const id of ['TC-AUTH-001', 'TC-AUTH-003']) {
      assert.ok(body.includes(`>${id}</a>`), `the result for ${id} is missing`);
    }
    assert.ok(body.includes('abc1234567890abcdef1234567890abcdef12345'), 'no commit hash');
    assert.ok(body.includes('a commit that broke a case'), 'no commit message');
    assert.match(
      body,
      /<pre><code>AssertionError[\s\S]*?302[\s\S]*?<\/code><\/pre>/,
      'the failure diagnostic is missing'
    );
  } finally {
    if (previous === undefined) delete process.env.TESTS_DIR;
    else process.env.TESTS_DIR = previous;
  }

  const committed = fs
    .readdirSync(path.join(__dirname, '..', 'runs'))
    .filter((f) => /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z\.md$/.test(f))
    .sort()
    .pop()
    .slice(0, -3);
  const real = await get(`${ctx.base}/runs/${committed}`, cookie);
  const realBody = await real.text();
  assert.equal(real.status, 200);
  assert.ok(realBody.includes('Repository state'), 'the committed report did not render');
});
