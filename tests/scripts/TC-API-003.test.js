'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { useServer, form, json, login, testid, inputValue } = require('./_harness');

const ctx = useServer();

test('TC-API-003 — the API rejects an incomplete payload with 400, not 401', async () => {
  for (const payload of [{ username: 'admin' }, { password: 'admin123' }]) {
    const res = await fetch(`${ctx.base}/api/login`, json(payload));

    assert.equal(res.status, 400, `${JSON.stringify(payload)} should be a bad request`);
    assert.deepEqual(await res.json(), {
      ok: false,
      error: 'Username and password are required.',
    });
  }
});
