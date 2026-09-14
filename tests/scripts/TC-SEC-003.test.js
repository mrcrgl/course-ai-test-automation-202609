'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { useServer, form, json, login, testid, inputValue } = require('./_harness');

const ctx = useServer();

test('TC-SEC-003 — a quote in the username cannot break out of the value attribute', async () => {
  const payload = '"><img src=x onerror=alert(1)>';
  const res = await fetch(`${ctx.base}/login`, form({ username: payload, password: 'x' }));
  const body = await res.text();

  assert.equal(res.status, 401);
  assert.doesNotMatch(body, /<img[^>]*onerror/i, 'an img tag escaped into the markup');
  assert.match(body, /value="&quot;&gt;&lt;img src=x onerror=alert\(1\)&gt;"/);

  // The username input must still be a single well-formed tag.
  const inputs = body.match(/<input[^>]*data-testid="username-input"[^>]*>/g);
  assert.equal(inputs.length, 1);
});
