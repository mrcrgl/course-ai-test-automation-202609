'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { useServer, login, get, testid } = require('./_harness');

const ctx = useServer();

const RUN_DIR = path.join(__dirname, '..', 'runs');
const RUN_FILE = /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z\.md$/;
const cell = (text, key) => (text.match(new RegExp(`^\\| ${key} \\| (.*) \\|$`, 'm')) || [])[1];

test('TC-UI-009 — the run list shows every recorded run, newest first', async () => {
  const cookie = await login(ctx.base, 'admin', 'admin123');
  const files = fs.readdirSync(RUN_DIR).filter((f) => RUN_FILE.test(f));
  const body = await (await get(`${ctx.base}/runs`, cookie)).text();

  assert.equal((body.match(/data-testid="run-row"/g) || []).length, files.length);

  const listed = [...body.matchAll(/href="\/runs\/([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(listed, [...files].sort().reverse().map((f) => f.slice(0, -3)));

  const newest = listed[0];
  const source = fs.readFileSync(path.join(RUN_DIR, `${newest}.md`), 'utf8');
  const row = (body.match(new RegExp(`<tr[^>]*data-testid="run-row">[\\s\\S]*?</tr>`)) || [])[0];
  assert.ok(row.includes(newest.replace(/T(\d{2})-(\d{2})-(\d{2})Z$/, 'T$1:$2:$3Z')), 'no run timestamp');
  assert.ok(row.includes(/^\*\*(PASS|FAIL)\*\*/m.exec(source)[1]), 'no verdict');
  for (const key of ['Passed', 'Failed', 'Skipped']) {
    assert.ok(row.includes(`>${cell(source, key)}<`), `no ${key} count`);
  }
  assert.ok(row.includes(cell(source, 'Commit').replace(/`/g, '')), 'no short commit hash');
  assert.ok(row.includes(cell(source, 'Wall clock')), 'no wall-clock duration');
  assert.match(row, new RegExp(`<a href="/runs/${newest}"`));
  assert.equal(testid(body, 'run-count'), String(files.length));
});
