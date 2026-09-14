'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { useServer, form, json, login, testid, inputValue } = require('./_harness');

const ctx = useServer();

test('TC-AUTH-002 — the second account logs in and is named on the success page', async () => {
  const sid = await login(ctx.base, 'tester', 'test123');
  assert.ok(sid, 'no sid cookie was issued');

  const body = await (await fetch(`${ctx.base}/success`, { headers: { cookie: sid } })).text();

  assert.equal(testid(body, 'username'), 'tester');
  assert.notEqual(testid(body, 'username'), 'admin');
});
