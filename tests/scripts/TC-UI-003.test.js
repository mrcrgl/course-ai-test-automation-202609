'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { useServer, form, json, login, testid, inputValue } = require('./_harness');

const ctx = useServer();

test('TC-UI-003 — the static stylesheet is served', async () => {
  const res = await fetch(`${ctx.base}/style.css`);
  const body = await res.text();

  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /^text\/css/);
  assert.ok(body.length > 0, 'stylesheet body is empty');
});
