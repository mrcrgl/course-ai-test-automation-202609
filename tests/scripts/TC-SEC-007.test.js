'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { useServer, login, get } = require('./_harness');

const ctx = useServer();

test('TC-SEC-007 — a script payload stored in a case file is displayed as text', async () => {
  const cookie = await login(ctx.base, 'admin', 'admin123');
  const res = await get(`${ctx.base}/cases/TC-SEC-001`, cookie);
  const body = await res.text();

  assert.equal(res.status, 200);
  assert.match(body, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.doesNotMatch(body, /<script>alert\(1\)<\/script>/, 'the payload survived unescaped');
  assert.doesNotMatch(body, /<script/i, 'the page carries an executable script element');
});
