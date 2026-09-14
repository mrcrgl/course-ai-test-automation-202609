'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { useServer, form, json, login, testid, inputValue } = require('./_harness');

const ctx = useServer();

test('TC-AUTH-011 — the username survives a failed attempt but the password does not', async () => {
  const res = await fetch(`${ctx.base}/login`, form({ username: 'tester', password: 'wrongpassword' }));
  const body = await res.text();

  assert.equal(res.status, 401);
  assert.equal(inputValue(body, 'username-input'), 'tester');
  assert.equal(inputValue(body, 'password-input'), null, 'the password input carries a value attribute');
  assert.ok(testid(body, 'error-message'), 'no error message shown');
});
