'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { useServer, form, json, login, testid, inputValue } = require('./_harness');

const ctx = useServer();

test('TC-AUTH-008 — surrounding whitespace in the username is trimmed', async () => {
  const res = await fetch(`${ctx.base}/login`, form({ username: '  admin  ', password: 'admin123' }));

  assert.equal(res.status, 302);
  assert.equal(res.headers.get('location'), '/success');

  const sid = res.headers.getSetCookie().find((c) => c.startsWith('sid=')).split(';')[0];
  const body = await (await fetch(`${ctx.base}/success`, { headers: { cookie: sid } })).text();
  const shown = testid(body, 'username');

  assert.equal(shown, 'admin');
  assert.equal(shown, shown.trim());
});
