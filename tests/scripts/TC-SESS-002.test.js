'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { useServer, form, json, login, testid, inputValue } = require('./_harness');

const ctx = useServer();

test('TC-SESS-002 — a logged-in user is redirected away from the login page', async () => {
  const sid = await login(ctx.base, 'admin', 'admin123');
  const res = await fetch(`${ctx.base}/`, { headers: { cookie: sid }, redirect: 'manual' });

  assert.equal(res.status, 302);
  assert.equal(res.headers.get('location'), '/success');
  assert.doesNotMatch(await res.text(), /data-testid="login-form"/);
});
