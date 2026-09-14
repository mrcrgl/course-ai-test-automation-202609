---
id: TC-UI-008
title: The case detail page shows the whole specification
version: 1
status: approved
owner: marc.riegel@nimbusforge.de
created: 2026-09-14
updated: 2026-09-14
test_level: system
test_type: functional
design_technique: checklist-based
priority: high
suite: regression
frequency: per-commit
automation: automated
script: tests/scripts/TC-UI-008.test.js
duration: 0.2s
environment: local-dev
last_reviewed: 2026-09-14
review_interval: 6m
stability: stable
references:
  - id: "#1/AC-4"
    type: acceptance-criterion
    source: https://github.com/mrcrgl/course-ai-test-automation-202609/issues/1
    demand: The detail page renders the front matter as a metadata block including each reference's id, type, source and demand, every body section, distinguishable Given/When/Then steps, and the test script as a code block.
---

# TC-UI-008 — The case detail page shows the whole specification

## Objective
Prove that reading a case in the browser is equivalent to reading the file: nothing is
summarised away, the traceability block is legible, the scenario keeps its structure and
the script is shown as code.

## References
| Reference | Type | Source | What it demands |
| --- | --- | --- | --- |
| `#1/AC-4` | Acceptance criterion | Issue #1 — Browse test cases and test runs in a login-gated web UI | Metadata with full references, all eleven body sections, distinguishable Given/When/Then, script as a code block |

## Preconditions
- The application is running at `http://localhost:3000`.
- The client has logged in as `admin` and holds the issued `sid` cookie.
- `tests/cases/TC-AUTH-003-login-wrong-password.md` exists and cites two references.

## Test Data
| Field | Value |
| --- | --- |
| Path | `/cases/TC-AUTH-003` |
| Sampled reference | `BSI-P-11` |
| Sections | Objective, References, Preconditions, Test Data, Scenario, Expected Result, Postconditions, Risk & Coverage, Test Script, Change Log, Notes |

## Scenario

**Given** the client has logged in as `admin`
**When** it requests `/cases/TC-AUTH-003`
**Then** the response status is `200`
**And** the front matter is rendered as a metadata block, with each reference's id, type, source and demand
**And** every body section of the file is present on the page
**And** the Given/When/Then steps are rendered as marked-up scenario steps rather than a paragraph
**And** the test script is rendered inside a code block

## Expected Result
The page carries the complete specification: metadata, traceability, all eleven sections,
a structured scenario and the script as preformatted code.

## Postconditions
- None — the page is read-only and makes no state change.

## Risk & Coverage
Not applicable — functional case, no threat model entry.

## Test Script
Implemented in `tests/scripts/TC-UI-008.test.js` — run with `npm test`.

```javascript
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
```

## Change Log
| Version | Date | Author | Change | Reason |
| --- | --- | --- | --- | --- |
| 1 | 2026-09-14 | marc.riegel@nimbusforge.de | Created | Issue #1 AC-4 requires the detail page to render the whole specification, not an excerpt |

## Notes
`TC-AUTH-003` is the sampled case because it is the format's worked example and the only
one citing two references, so a renderer that shows just the first one fails here.
The script assertion compares against the file in `tests/scripts/`, which means it also
detects a page that renders the script as escaped prose outside a `<pre>` block.
