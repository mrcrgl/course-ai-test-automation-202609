'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { useServer, form, json, login, testid, inputValue } = require('./_harness');

const ctx = useServer();

test('TC-AUTH-007 — a submission without a username is rejected as missing input', async () => {
  const res = await fetch(`${ctx.base}/login`, form({ username: '', password: 'admin123' }));
  const body = await res.text();

  assert.equal(res.status, 400);
  assert.equal(testid(body, 'error-message'), 'Username and password are required.');
  assert.equal(res.headers.getSetCookie().filter((c) => c.startsWith('sid=')).length, 0);
});
