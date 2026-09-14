'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { useServer, form, json, login, testid, inputValue } = require('./_harness');

const ctx = useServer();

test('TC-SESS-008 — every login is issued a distinct session identifier', async () => {
  const first = await login(ctx.base, 'admin', 'admin123');
  const second = await login(ctx.base, 'admin', 'admin123');

  assert.ok(first && second, 'both logins must issue a cookie');
  assert.notEqual(first, second, 'two logins reused the same session identifier');

  // Both must independently address a live session.
  for (const sid of [first, second]) {
    const res = await fetch(`${ctx.base}/success`, { headers: { cookie: sid }, redirect: 'manual' });
    assert.equal(res.status, 200);
  }
});
