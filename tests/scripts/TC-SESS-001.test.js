'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { useServer, form, json, login, testid, inputValue } = require('./_harness');

const ctx = useServer();

test('TC-SESS-001 — the success page is unreachable without a session', async () => {
  const res = await fetch(`${ctx.base}/success`, { redirect: 'manual' });
  const body = await res.text();

  assert.equal(res.status, 302);
  assert.equal(res.headers.get('location'), '/');
  assert.doesNotMatch(body, /Login successful/);

  const followed = await fetch(`${ctx.base}/`, { redirect: 'manual' });
  assert.match(await followed.text(), /data-testid="login-form"/);
});
