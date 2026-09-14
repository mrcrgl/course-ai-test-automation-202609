'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { useServer, form, json, login, testid, inputValue } = require('./_harness');

const ctx = useServer();

test('TC-SEC-002 — a wrong password and an unknown user are indistinguishable', async () => {
  const known = await fetch(`${ctx.base}/login`, form({ username: 'admin', password: 'wrongpassword' }));
  const unknown = await fetch(`${ctx.base}/login`, form({ username: 'nobody', password: 'wrongpassword' }));

  assert.equal(known.status, 401);
  assert.equal(unknown.status, 401);
  assert.equal(known.status, unknown.status);

  const knownError = testid(await known.text(), 'error-message');
  const unknownError = testid(await unknown.text(), 'error-message');

  assert.equal(knownError, 'Invalid username or password.');
  assert.equal(knownError, unknownError);
  assert.doesNotMatch(knownError, /exist|unknown|no such|password is/i);
});
