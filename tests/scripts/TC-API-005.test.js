'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { useServer, form, json, login, testid, inputValue } = require('./_harness');

const ctx = useServer();

test('TC-API-005 — a successful API login grants no session', async () => {
  const res = await fetch(`${ctx.base}/api/login`, json({ username: 'admin', password: 'admin123' }));

  assert.equal(res.status, 200);
  assert.deepEqual(res.headers.getSetCookie(), [], 'the API issued a cookie');

  // Without a cookie the protected page must still be out of reach.
  const success = await fetch(`${ctx.base}/success`, { redirect: 'manual' });
  assert.equal(success.status, 302);
  assert.equal(success.headers.get('location'), '/');
});
