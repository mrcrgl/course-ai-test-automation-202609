'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { useServer, form, json, login, testid, inputValue } = require('./_harness');

const ctx = useServer();

test('TC-SEC-001 — a script tag in the username is escaped, not executed', async () => {
  const payload = '<script>alert(1)</script>';
  const res = await fetch(`${ctx.base}/login`, form({ username: payload, password: 'x' }));
  const body = await res.text();

  assert.equal(res.status, 401);
  assert.match(body, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.doesNotMatch(body, /<script>alert\(1\)<\/script>/, 'the payload survived unescaped');
  assert.equal(inputValue(body, 'username-input'), '&lt;script&gt;alert(1)&lt;/script&gt;');
});
