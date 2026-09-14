'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { useServer, login, get } = require('./_harness');

const ctx = useServer();

const TESTS = path.join(__dirname, '..');

/** Every file under tests/, with the size and mtime that identify its content. */
function snapshot(dir) {
  const out = {};
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) Object.assign(out, snapshot(full));
    else {
      const s = fs.statSync(full);
      out[path.relative(TESTS, full)] = `${s.size}:${s.mtimeMs}`;
    }
  }
  return out;
}

test('TC-SEC-009 — browsing the pages never writes to the test directories', async () => {
  const cookie = await login(ctx.base, 'admin', 'admin123');
  const newest = fs
    .readdirSync(path.join(TESTS, 'runs'))
    .filter((f) => /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z\.md$/.test(f))
    .sort()
    .pop()
    .slice(0, -3);
  const paths = ['/cases', '/cases/TC-AUTH-003', '/runs', `/runs/${newest}`];

  const before = snapshot(TESTS);

  for (let i = 0; i < 3; i++) {
    for (const p of paths) {
      assert.equal((await get(`${ctx.base}${p}`, cookie)).status, 200, `${p} did not render`);
    }
  }

  const after = snapshot(TESTS);
  assert.deepEqual(Object.keys(after), Object.keys(before), 'a file appeared or disappeared');
  assert.deepEqual(after, before, 'a file under tests/ was modified');
});
