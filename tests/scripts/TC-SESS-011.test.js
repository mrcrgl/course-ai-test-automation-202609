'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { useServer, get } = require('./_harness');

const ctx = useServer();

const newestRun = fs
  .readdirSync(path.join(__dirname, '..', 'runs'))
  .filter((f) => /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z\.md$/.test(f))
  .sort()
  .pop()
  .slice(0, -3);

test('TC-SESS-011 — the browse pages are unreachable without a session', async () => {
  const paths = ['/cases', '/cases/TC-AUTH-003', '/runs', `/runs/${newestRun}`];

  for (const p of paths) {
    const res = await get(`${ctx.base}${p}`);
    const body = await res.text();

    assert.equal(res.status, 302, `${p} did not redirect`);
    assert.equal(res.headers.get('location'), '/', `${p} redirected elsewhere`);
    assert.doesNotMatch(
      body,
      /data-testid="(case-table|case-meta|run-table|run-report)"|TC-AUTH-003|Login is rejected/,
      `${p} leaked content to an unauthenticated client`
    );
  }
});
