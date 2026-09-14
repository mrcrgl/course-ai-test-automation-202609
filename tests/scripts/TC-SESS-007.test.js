'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { useServer, form, json, login, testid, inputValue } = require('./_harness');

const ctx = useServer();

test('TC-SESS-007 — GET /login redirects to the login page instead of 404', async () => {
  const res = await fetch(`${ctx.base}/login`, { redirect: 'manual' });

  assert.equal(res.status, 302);
  assert.equal(res.headers.get('location'), '/');
  assert.notEqual(res.status, 404);

  const page = await fetch(`${ctx.base}/`, { redirect: 'manual' });
  assert.match(await page.text(), /data-testid="login-form"/);
});
