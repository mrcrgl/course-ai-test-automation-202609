'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { useServer, form, json, login, testid, inputValue } = require('./_harness');

const ctx = useServer();

test('TC-AUTH-001 — valid admin credentials authenticate and reach the success page', async () => {
  const res = await fetch(`${ctx.base}/login`, form({ username: 'admin', password: 'admin123' }));

  assert.equal(res.status, 302);
  assert.equal(res.headers.get('location'), '/success');

  const cookie = res.headers.getSetCookie().find((c) => c.startsWith('sid='));
  assert.ok(cookie, 'no sid cookie was issued');

  const success = await fetch(`${ctx.base}/success`, {
    headers: { cookie: cookie.split(';')[0] },
    redirect: 'manual',
  });
  const body = await success.text();

  assert.equal(success.status, 200);
  assert.equal(testid(body, 'success-heading'), 'Login successful');
  assert.equal(testid(body, 'username'), 'admin');
});
