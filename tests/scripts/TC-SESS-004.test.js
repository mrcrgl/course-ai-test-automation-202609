'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { useServer, form, json, login, testid, inputValue } = require('./_harness');

const ctx = useServer();

test('TC-SESS-004 — a session identifier is rejected after logout', async () => {
  const sid = await login(ctx.base, 'admin', 'admin123');

  const before = await fetch(`${ctx.base}/success`, { headers: { cookie: sid }, redirect: 'manual' });
  assert.equal(before.status, 200, 'precondition: the session should be valid before logout');

  await fetch(`${ctx.base}/logout`, { method: 'POST', headers: { cookie: sid }, redirect: 'manual' });

  // Replaying the captured cookie must not work even though the client still holds it.
  const replay = await fetch(`${ctx.base}/success`, { headers: { cookie: sid }, redirect: 'manual' });

  assert.equal(replay.status, 302);
  assert.equal(replay.headers.get('location'), '/');
  assert.doesNotMatch(await replay.text(), /Login successful/);
});
