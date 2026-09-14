'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { useServer, form, json, login, testid, inputValue } = require('./_harness');

const ctx = useServer();

test('TC-UI-005 — an unknown path returns 404 without leaking internals', async () => {
  const res = await fetch(`${ctx.base}/does-not-exist`, { redirect: 'manual' });
  const body = await res.text();

  assert.equal(res.status, 404);
  assert.doesNotMatch(body, /Login successful/);
  assert.doesNotMatch(body, /at Object\.|node_modules|\/home\//, 'response leaks a stack trace or filesystem path');
});
