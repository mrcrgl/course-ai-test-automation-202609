'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { useServer, login, get } = require('./_harness');

const ctx = useServer();

const SECTIONS = [
  'objective', 'references', 'preconditions', 'test-data', 'scenario', 'expected-result',
  'postconditions', 'risk-coverage', 'test-script', 'change-log', 'notes',
];

/** The markup of one `<section data-section="...">` of the page. */
const section = (html, slug) =>
  (html.match(new RegExp(`<section data-section="${slug}">[\\s\\S]*?(?=<section |</main>)`)) || [])[0];

test('TC-UI-008 — the case detail page shows the whole specification', async () => {
  const cookie = await login(ctx.base, 'admin', 'admin123');
  const res = await get(`${ctx.base}/cases/TC-AUTH-003`, cookie);
  const body = await res.text();

  assert.equal(res.status, 200);

  const references = section(body, 'references');
  assert.match(body, /data-testid="case-meta"/);
  for (const value of ['BSI-P-11', 'bsi-practice', 'BSI-Standard 200-3 §7 — Suitability of security safeguards']) {
    assert.ok(references.includes(value), `the references block is missing ${value}`);
  }
  assert.ok(
    references.includes('All aspects of the relevant threat must be covered in full'),
    'the references block does not show what the reference demands'
  );

  for (const slug of SECTIONS) {
    assert.ok(section(body, slug), `the ${slug} section is missing`);
  }

  const scenario = section(body, 'scenario');
  assert.match(scenario, /<ol class="scenario" data-testid="scenario">/);
  for (const keyword of ['Given', 'When', 'Then']) {
    assert.ok(
      scenario.includes(`<span class="step-keyword">${keyword}</span>`),
      `the ${keyword} steps are not marked up`
    );
  }

  const script = section(body, 'test-script');
  const source = fs.readFileSync(path.join(__dirname, 'TC-AUTH-003.test.js'), 'utf8');
  // The first substantial line with no characters that HTML escaping would
  // rewrite, so it can be matched verbatim against the rendered page.
  const line = source.split('\n').find((l) => l.length > 12 && !/[&<>"']/.test(l));
  assert.match(script, /<pre><code>/);
  assert.ok(script.includes(line), 'the script body is not on the page');
  assert.ok(
    script.indexOf('<pre><code>') < script.indexOf(line),
    'the script is rendered as prose rather than inside a code block'
  );
});
