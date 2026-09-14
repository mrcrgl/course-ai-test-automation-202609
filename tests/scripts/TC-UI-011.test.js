'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { useServer, login, get } = require('./_harness');

const ctx = useServer();

test('TC-UI-011 — a run report links to each case it executed', async () => {
  const cookie = await login(ctx.base, 'admin', 'admin123');
  const newest = fs
    .readdirSync(path.join(__dirname, '..', 'runs'))
    .filter((f) => /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z\.md$/.test(f))
    .sort()
    .pop()
    .slice(0, -3);

  const report = await (await get(`${ctx.base}/runs/${newest}`, cookie)).text();
  const links = [...report.matchAll(/<a href="(\/cases\/(TC-[A-Z]+-\d{3}))"/g)];
  assert.ok(links.length > 0, 'the results table links to no case at all');

  for (const [, href, id] of links.slice(0, 3)) {
    const res = await get(`${ctx.base}${href}`, cookie);
    const body = await res.text();
    assert.equal(res.status, 200, `${href} did not resolve`);
    assert.match(body, new RegExp(`<h1>${id} — `), `${href} is not the page for ${id}`);
  }
});
