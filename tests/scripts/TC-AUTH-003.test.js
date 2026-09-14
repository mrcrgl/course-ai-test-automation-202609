'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const app = require('../../server');

let server;
let base;

before(async () => {
  server = app.listen(0);
  await once(server, 'listening');
  base = `http://localhost:${server.address().port}`;
});

after(() => server.close());

test('TC-AUTH-003 — a known user with the wrong password is rejected', async () => {
  const response = await fetch(`${base}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ username: 'admin', password: 'wrongpassword' }),
    redirect: 'manual',
  });
  const body = await response.text();

  // Then the response status is 401
  assert.equal(response.status, 401);

  // And the login form is redisplayed
  assert.match(body, /data-testid="login-form"/);

  // And data-testid="error-message" reads 'Invalid username or password.'
  const error = body.match(/data-testid="error-message"[^>]*>([^<]*)</);
  assert.ok(error, 'no element with data-testid="error-message" in the response');
  assert.equal(error[1].trim(), 'Invalid username or password.');

  // And no sid session cookie is set
  const cookies = response.headers.getSetCookie();
  assert.ok(
    !cookies.some((c) => c.startsWith('sid=')),
    `expected no sid cookie, got ${JSON.stringify(cookies)}`
  );

  // And the user is not redirected to /success
  assert.equal(response.headers.get('location'), null);
  assert.doesNotMatch(body, /Login successful/);
});
