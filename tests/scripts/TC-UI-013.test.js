'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { useServer, login, get } = require('./_harness');

const ctx = useServer();

test('TC-UI-013 — an empty run directory renders an empty state, not an error', async () => {
  const cookie = await login(ctx.base, 'admin', 'admin123');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tc-ui-013-'));
  fs.mkdirSync(path.join(dir, 'cases'));
  fs.mkdirSync(path.join(dir, 'runs'));

  const previous = process.env.TESTS_DIR;
  process.env.TESTS_DIR = dir;
  try {
    const res = await get(`${ctx.base}/runs`, cookie);
    const body = await res.text();

    assert.equal(res.status, 200);
    assert.match(body, /data-testid="empty-runs"/);
    assert.match(body, /No runs have been recorded yet/);
    assert.doesNotMatch(body, /data-testid="run-row"/);
  } finally {
    if (previous === undefined) delete process.env.TESTS_DIR;
    else process.env.TESTS_DIR = previous;
  }
});
