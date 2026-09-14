'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { useServer, form, json, login, testid, inputValue } = require('./_harness');

const ctx = useServer();

test('TC-SESS-006 — the session cookie is issued with HttpOnly, SameSite and Path', async () => {
  const res = await fetch(`${ctx.base}/login`, form({ username: 'admin', password: 'admin123' }));
  const cookie = res.headers.getSetCookie().find((c) => c.startsWith('sid='));

  assert.ok(cookie, 'no sid cookie was issued');
  assert.match(cookie, /HttpOnly/i);
  assert.match(cookie, /SameSite=Lax/i);
  assert.match(cookie, /Path=\//);
});
