'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { useServer, login, get, testid } = require('./_harness');

const ctx = useServer();

const CASE_DIR = path.join(__dirname, '..', 'cases');
const field = (text, key) => (text.match(new RegExp(`^${key}: (.*)$`, 'm')) || [])[1];

/** The `<tr>` of the listing that links to the given case. */
const rowFor = (html, id) =>
  (html.match(new RegExp(`<tr[^>]*data-testid="case-row">(?:(?!</tr>)[\\s\\S])*?/cases/${id}"[\\s\\S]*?</tr>`)) || [])[0];

test('TC-UI-007 — the case list shows every case with its classification', async () => {
  const cookie = await login(ctx.base, 'admin', 'admin123');
  const files = fs.readdirSync(CASE_DIR).filter((f) => /^TC-.*\.md$/.test(f));
  const body = await (await get(`${ctx.base}/cases`, cookie)).text();

  assert.equal((body.match(/data-testid="case-row"/g) || []).length, files.length);

  const source = fs.readFileSync(path.join(CASE_DIR, 'TC-AUTH-003-login-wrong-password.md'), 'utf8');
  const row = rowFor(body, 'TC-AUTH-003');
  assert.ok(row, 'no row for TC-AUTH-003');
  for (const key of ['title', 'test_type', 'priority', 'suite', 'automation']) {
    assert.ok(row.includes(field(source, key)), `row is missing ${key}`);
  }

  assert.match(row, /<a href="\/cases\/TC-AUTH-003"/);
  assert.equal(testid(body, 'case-count'), String(files.length));
});
