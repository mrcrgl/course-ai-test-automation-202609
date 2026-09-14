'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { useServer, login, get } = require('./_harness');

const ctx = useServer();

const CASE_DIR = path.join(__dirname, '..', 'cases');
const GOOD = ['TC-AUTH-003-login-wrong-password.md', 'TC-UI-001-login-page-renders.md'];

test('TC-UI-014 — an unreadable case file is flagged, not dropped', async () => {
  const cookie = await login(ctx.base, 'admin', 'admin123');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tc-ui-014-'));
  fs.mkdirSync(path.join(dir, 'cases'));
  fs.mkdirSync(path.join(dir, 'runs'));
  for (const file of GOOD) {
    fs.copyFileSync(path.join(CASE_DIR, file), path.join(dir, 'cases', file));
  }
  fs.writeFileSync(
    path.join(dir, 'cases', 'TC-BAD-001-no-front-matter.md'),
    '# TC-BAD-001 — this file never got its front matter\n\nJust prose.\n'
  );

  const previous = process.env.TESTS_DIR;
  process.env.TESTS_DIR = dir;
  try {
    const res = await get(`${ctx.base}/cases`, cookie);
    const body = await res.text();

    assert.equal(res.status, 200);
    assert.match(body, /<a href="\/cases\/TC-AUTH-003"/);
    assert.match(body, /<a href="\/cases\/TC-UI-001"/);
    assert.match(body, /data-testid="case-unreadable"/);
    assert.match(body, /TC-BAD-001-no-front-matter\.md/);
    assert.equal((body.match(/data-testid="case-row"/g) || []).length, GOOD.length + 1);
  } finally {
    if (previous === undefined) delete process.env.TESTS_DIR;
    else process.env.TESTS_DIR = previous;
  }
});
