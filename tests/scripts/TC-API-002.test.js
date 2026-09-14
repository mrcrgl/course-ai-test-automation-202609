'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { useServer, form, json, login, testid, inputValue } = require('./_harness');

const ctx = useServer();

test('TC-API-002 — the API rejects a wrong password with 401', async () => {
  const res = await fetch(`${ctx.base}/api/login`, json({ username: 'tester', password: 'nope' }));
  const body = await res.text();

  assert.equal(res.status, 401);
  assert.deepEqual(JSON.parse(body), { ok: false, error: 'Invalid username or password.' });
  assert.doesNotMatch(body, /test123/, 'the response leaks the correct password');
});
