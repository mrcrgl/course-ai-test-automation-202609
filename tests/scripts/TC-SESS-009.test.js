'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { useServer, form, json, login, testid, inputValue } = require('./_harness');

const ctx = useServer();

test('TC-SESS-009 — logging out of one session leaves other sessions untouched', async () => {
  const a = await login(ctx.base, 'admin', 'admin123');
  const b = await login(ctx.base, 'tester', 'test123');

  await fetch(`${ctx.base}/logout`, { method: 'POST', headers: { cookie: a }, redirect: 'manual' });

  const killed = await fetch(`${ctx.base}/success`, { headers: { cookie: a }, redirect: 'manual' });
  assert.equal(killed.status, 302, 'session A should be gone');

  const survivor = await fetch(`${ctx.base}/success`, { headers: { cookie: b }, redirect: 'manual' });
  assert.equal(survivor.status, 200, 'session B must survive');
  assert.equal(testid(await survivor.text(), 'username'), 'tester');
});
