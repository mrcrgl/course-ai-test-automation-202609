'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { useServer, form, json, login, testid, inputValue } = require('./_harness');

const ctx = useServer();

test('TC-SESS-005 — a session cookie the server never issued is rejected', async () => {
  for (const value of ['sid=not-a-real-session-id', 'sid=', 'sid=k3j2h1g0f9e8d7c6b5a4']) {
    const res = await fetch(`${ctx.base}/success`, { headers: { cookie: value }, redirect: 'manual' });

    assert.equal(res.status, 302, `${value} was not rejected`);
    assert.equal(res.headers.get('location'), '/');
    assert.doesNotMatch(await res.text(), /Login successful/);
  }
});
