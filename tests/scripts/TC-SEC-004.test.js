'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { useServer, form, json, login, testid, inputValue } = require('./_harness');

const ctx = useServer();

test('TC-SEC-004 — a submitted password is never echoed back in a response', async () => {
  const secret = 'SuperSecret123';

  const failed = await fetch(`${ctx.base}/login`, form({ username: 'admin', password: secret }));
  assert.equal(failed.status, 401);
  assert.doesNotMatch(await failed.text(), new RegExp(secret));

  const ok = await fetch(`${ctx.base}/login`, form({ username: 'admin', password: 'admin123' }));
  const sid = ok.headers.getSetCookie().find((c) => c.startsWith('sid=')).split(';')[0];
  const success = await fetch(`${ctx.base}/success`, { headers: { cookie: sid } });
  assert.doesNotMatch(await success.text(), /admin123/, 'the success page echoes the password');

  const api = await fetch(`${ctx.base}/api/login`, json({ username: 'admin', password: secret }));
  assert.doesNotMatch(await api.text(), new RegExp(secret));
});
