'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { useServer, form, json, login, testid, inputValue } = require('./_harness');

const ctx = useServer();

test('TC-UI-002 — the password field is declared as a masked input', async () => {
  const body = await (await fetch(`${ctx.base}/`)).text();
  const field = body.match(/<input[^>]*data-testid="password-input"[^>]*>/);

  assert.ok(field, 'no element with data-testid="password-input"');
  assert.match(field[0], /type="password"/);
  assert.match(field[0], /autocomplete="current-password"/);
  assert.equal(inputValue(body, 'password-input'), null);
});
