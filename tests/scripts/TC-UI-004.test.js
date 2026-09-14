'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { useServer, form, json, login, testid, inputValue } = require('./_harness');

const ctx = useServer();

test('TC-UI-004 — the login page shows the demo credentials hint', async () => {
  const body = await (await fetch(`${ctx.base}/`)).text();
  const hint = body.match(/<p class="hint">([\s\S]*?)<\/p>/);

  assert.ok(hint, 'no hint paragraph on the login page');
  assert.match(hint[1], /Demo credentials/);
  assert.match(hint[1], /admin/);
  assert.match(hint[1], /admin123/);
});
