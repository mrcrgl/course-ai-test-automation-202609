'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { useServer, login, get } = require('./_harness');

const ctx = useServer();

test('TC-UI-012 — a case links back to its most recent recorded results', async () => {
  const cookie = await login(ctx.base, 'admin', 'admin123');
  const runs = fs
    .readdirSync(path.join(__dirname, '..', 'runs'))
    .filter((f) => /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z\.md$/.test(f))
    .sort()
    .reverse();
  const newest = runs.find((f) =>
    fs.readFileSync(path.join(__dirname, '..', 'runs', f), 'utf8').includes('TC-AUTH-003')
  );
  assert.ok(newest, 'no recorded run covers TC-AUTH-003');

  const body = await (await get(`${ctx.base}/cases/TC-AUTH-003`, cookie)).text();
  const results = (body.match(/<table class="grid" data-testid="case-results">[\s\S]*?<\/table>/) || [])[0];

  assert.ok(results, 'the case page shows no results table');
  assert.match(results, new RegExp(`<a href="/runs/${newest.slice(0, -3)}"`));
  assert.match(results, /badge-pass">PASS</);

  const res = await get(`${ctx.base}/runs/${newest.slice(0, -3)}`, cookie);
  assert.equal(res.status, 200);
});
