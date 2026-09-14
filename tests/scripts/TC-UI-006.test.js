'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { useServer, login, get } = require('./_harness');

const ctx = useServer();

test('TC-UI-006 — the success page links to the case and run browsers', async () => {
  const cookie = await login(ctx.base, 'admin', 'admin123');
  const success = await (await get(`${ctx.base}/success`, cookie)).text();

  assert.match(success, /<a href="\/cases"[^>]*data-testid="cases-link"/);
  assert.match(success, /<a href="\/runs"[^>]*data-testid="runs-link"/);
  assert.equal((await get(`${ctx.base}/cases`, cookie)).status, 200);
  assert.equal((await get(`${ctx.base}/runs`, cookie)).status, 200);
});
