'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { useServer, form, json, login, testid, inputValue } = require('./_harness');

const ctx = useServer();

test('TC-UI-001 — the login page renders with all form controls', async () => {
  const res = await fetch(`${ctx.base}/`, { redirect: 'manual' });
  const body = await res.text();

  assert.equal(res.status, 200);
  assert.match(body, /<form[^>]*method="post"[^>]*action="\/login"[^>]*data-testid="login-form"/);
  assert.match(body, /<input[^>]*data-testid="username-input"/);
  assert.match(body, /<input[^>]*data-testid="password-input"/);
  assert.match(body, /<button[^>]*data-testid="login-button"/);
  assert.doesNotMatch(body, /data-testid="error-message"/);
});
