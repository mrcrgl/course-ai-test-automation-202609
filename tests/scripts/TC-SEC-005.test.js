'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { useServer, login, get } = require('./_harness');

const ctx = useServer();

const REPO = path.resolve(__dirname, '..', '..');

test('TC-SEC-005 — an unknown identifier returns 404 without leaking internals', async () => {
  const cookie = await login(ctx.base, 'admin', 'admin123');

  for (const p of ['/cases/TC-NOPE-999', '/runs/2999-12-31T23-59-59Z']) {
    const res = await get(`${ctx.base}${p}`, cookie);
    const body = await res.text();

    assert.equal(res.status, 404, `${p} did not return 404`);
    assert.doesNotMatch(body, /at [\w.]+ \(|\.js:\d+:\d+|Error:/, `${p} leaked a stack trace`);
    assert.ok(!body.includes(REPO), `${p} leaked a filesystem path`);
    assert.doesNotMatch(body, /ENOENT|no such file/i, `${p} leaked the underlying error`);
  }
});
