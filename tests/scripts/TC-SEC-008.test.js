'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { useServer, login, get } = require('./_harness');

const ctx = useServer();

test('TC-SEC-008 — an attribute-breakout payload in a case file is displayed as text', async () => {
  const cookie = await login(ctx.base, 'admin', 'admin123');
  const res = await get(`${ctx.base}/cases/TC-SEC-003`, cookie);
  const body = await res.text();

  assert.equal(res.status, 200);
  assert.match(body, /&quot;&gt;&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.doesNotMatch(body, /<img[^>]*onerror/i, 'an img element with an onerror handler is present');
  assert.doesNotMatch(body, /<img/i, 'the page carries an img element');
});
