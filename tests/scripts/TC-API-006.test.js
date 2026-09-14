'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { useServer, form, json, login, testid, inputValue } = require('./_harness');

const ctx = useServer();

test('TC-API-006 — the API login endpoint is not exposed over GET', async () => {
  const res = await fetch(`${ctx.base}/api/login?username=admin&password=admin123`, {
    redirect: 'manual',
  });

  assert.notEqual(res.status, 200);
  assert.equal(res.status, 404);
  assert.deepEqual(res.headers.getSetCookie(), []);
  assert.doesNotMatch(await res.text(), /"ok":\s*true/);
});
