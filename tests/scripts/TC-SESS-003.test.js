'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { useServer, form, json, login, testid, inputValue } = require('./_harness');

const ctx = useServer();

test('TC-SESS-003 — logout clears the cookie and returns to the login page', async () => {
  const sid = await login(ctx.base, 'admin', 'admin123');
  const res = await fetch(`${ctx.base}/logout`, {
    method: 'POST',
    headers: { cookie: sid },
    redirect: 'manual',
  });

  assert.equal(res.status, 302);
  assert.equal(res.headers.get('location'), '/');

  const cleared = res.headers.getSetCookie().find((c) => c.startsWith('sid='));
  assert.ok(cleared, 'no Set-Cookie header clearing sid');
  assert.match(cleared, /sid=;/);

  const page = await fetch(`${ctx.base}/`, { redirect: 'manual' });
  assert.match(await page.text(), /data-testid="login-form"/);
});
