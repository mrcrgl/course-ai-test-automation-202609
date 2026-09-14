'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { useServer, form, json, login, testid, inputValue } = require('./_harness');

const ctx = useServer();

test('TC-API-001 — the API accepts valid credentials', async () => {
  const res = await fetch(`${ctx.base}/api/login`, json({ username: 'tester', password: 'test123' }));
  const body = await res.text();

  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /^application\/json/);
  assert.deepEqual(JSON.parse(body), { ok: true, username: 'tester' });
  assert.doesNotMatch(body, /test123/, 'the response echoes the password');
});
