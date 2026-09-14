'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { useServer, login, get } = require('./_harness');

const ctx = useServer();

// Encoded, so the client cannot normalise the traversal away before it is sent.
const TRAVERSALS = [
  '/cases/..%2F..%2Fserver.js',
  '/cases/%2e%2e%2f%2e%2e%2fpackage.json',
  '/runs/..%2F..%2Fpackage.json',
  '/runs/..%2F..%2Fviews%2Flogin.html',
  '/runs/..%2F..%2FREADME', // the route appends `.md`, so this one addresses a real file
];

test('TC-SEC-006 — a traversal identifier cannot read outside the test directories', async () => {
  const cookie = await login(ctx.base, 'admin', 'admin123');

  for (const p of TRAVERSALS) {
    const res = await get(`${ctx.base}${p}`, cookie);
    const body = await res.text();

    assert.ok([400, 404].includes(res.status), `${p} returned ${res.status}`);
    assert.doesNotMatch(body, /SESSION_COOKIE|cookie-parser|require\(/, `${p} served source`);
    assert.doesNotMatch(body, /"dependencies"|"llm-testing"/, `${p} served package.json`);
    assert.doesNotMatch(body, /data-testid="login-form"/, `${p} served a view template`);
    assert.doesNotMatch(body, /Login demo app|## Credentials/, `${p} served a document outside tests/`);
  }
});
