'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { useServer, form, json, login, testid, inputValue } = require('./_harness');

const ctx = useServer();

test('TC-API-004 — the API handles an empty or absent body without failing', async () => {
  const empty = await fetch(`${ctx.base}/api/login`, json({}));
  assert.equal(empty.status, 400);
  assert.deepEqual(await empty.json(), {
    ok: false,
    error: 'Username and password are required.',
  });

  const none = await fetch(`${ctx.base}/api/login`, json(undefined));
  assert.equal(none.status, 400);
  assert.ok(none.status < 500, 'an absent body must not raise a server error');
});
