'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { useServer, form, json, login, testid, inputValue } = require('./_harness');

const ctx = useServer();

test('TC-SESS-010 — logging out without a session is handled gracefully', async () => {
  const res = await fetch(`${ctx.base}/logout`, { method: 'POST', redirect: 'manual' });

  assert.equal(res.status, 302);
  assert.equal(res.headers.get('location'), '/');
  assert.ok(res.status < 500, 'logout without a session must not raise a server error');
});
