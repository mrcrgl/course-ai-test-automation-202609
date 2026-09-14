'use strict';

// Shared bootstrap for case scripts. Not a test file itself (the `*.test.js`
// glob skips it). Each case script stays independent: it starts its own server
// instance and tears it down, and never relies on another case having run.

const { before, after } = require('node:test');
const { once } = require('node:events');
const app = require('../../server');

/** Starts the app on an ephemeral port for the current test file. */
function useServer() {
  const ctx = { base: '' };
  let server;
  before(async () => {
    server = app.listen(0);
    await once(server, 'listening');
    ctx.base = `http://localhost:${server.address().port}`;
  });
  after(() => server.close());
  return ctx;
}

/** Request init for an HTML form submission; redirects are never followed. */
function form(fields) {
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(fields),
    redirect: 'manual',
  };
}

/** Request init for a JSON POST. Pass `undefined` to send no body at all. */
function json(body) {
  const init = { method: 'POST', redirect: 'manual' };
  if (body !== undefined) {
    init.headers = { 'Content-Type': 'application/json' };
    init.body = JSON.stringify(body);
  }
  return init;
}

/** Logs in and returns the `sid=...` cookie pair, or null if none was issued. */
async function login(base, username, password) {
  const res = await fetch(`${base}/login`, form({ username, password }));
  const cookie = res.headers.getSetCookie().find((c) => c.startsWith('sid='));
  return cookie ? cookie.split(';')[0] : null;
}

/** Text of the element carrying `data-testid="<id>"`, or null. */
function testid(html, id) {
  const m = html.match(new RegExp(`data-testid="${id}"[^>]*>([^<]*)<`));
  return m ? m[1].trim() : null;
}

/** Value attribute of the input carrying `data-testid="<id>"`, or null. */
function inputValue(html, id) {
  const tag = html.match(new RegExp(`<input[^>]*data-testid="${id}"[^>]*>`));
  if (!tag) return null;
  const v = tag[0].match(/value="([^"]*)"/);
  return v ? v[1] : null;
}

module.exports = { useServer, form, json, login, testid, inputValue };
