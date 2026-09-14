'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { useServer, form, json, login, testid, inputValue } = require('./_harness');

const ctx = useServer();

test('TC-AUTH-009 — a password with surrounding whitespace does not match', async () => {
  const res = await fetch(`${ctx.base}/login`, form({ username: 'admin', password: ' admin123 ' }));
  const body = await res.text();

  assert.equal(res.status, 401);
  assert.equal(testid(body, 'error-message'), 'Invalid username or password.');
  assert.equal(res.headers.getSetCookie().filter((c) => c.startsWith('sid=')).length, 0);
  assert.equal(res.headers.get('location'), null);
});
