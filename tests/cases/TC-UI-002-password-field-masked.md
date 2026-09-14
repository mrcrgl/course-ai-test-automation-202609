---
id: TC-UI-002
title: The password field is a masked input
version: 2
status: approved
owner: marc.riegel@nimbusforge.de
created: 2026-09-14
updated: 2026-09-14
test_level: system
test_type: usability
design_technique: checklist-based
priority: medium
suite: regression
frequency: release
automation: semi-automated
script: tests/scripts/TC-UI-002.test.js
duration: 0.1s
environment: local-dev
last_reviewed: 2026-09-14
review_interval: 12m
stability: stable
references:
  - id: BSI-P-13
    type: bsi-practice
    source: BSI-Standard 200-3 §7 — User friendliness of security safeguards
    demand: Safeguards must be transparent to the parties concerned and tolerant of the environment they run in.
---

# TC-UI-002 — The password field is a masked input

## Objective
Prove the password is not rendered in clear text on screen, where it is exposed to anyone
able to see the display.

## References
| Reference | Type | Source | What it demands |
| --- | --- | --- | --- |
| `BSI-P-13` | BSI practice | 200-3 §7 — User friendliness | The safeguard must be transparent to the user and suited to its environment |

## Preconditions
- The application is running at `http://localhost:3000`.

## Test Data
| Field | Value |
| --- | --- |
| Password typed (manual part) | `admin123` |

## Scenario

**Given** the user is on the login page at `/`
**When** the page is inspected
**Then** an input with `data-testid="password-input"` exists
**And** it carries `type="password"`
**And** it carries `autocomplete="current-password"`
**And** it carries no `value` attribute
**And** typing into it in a browser renders mask characters rather than the typed text

## Expected Result
The password is masked on screen and is never pre-filled from a previous response.

## Postconditions
- None — the case makes no state change.

## Risk & Coverage
Not applicable — usability case, no threat model entry. The confidentiality aspect of the
password itself is covered by TC-SEC-004.

## Test Script
Implemented in `tests/scripts/TC-UI-002.test.js` — run with `npm test`.

```javascript
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { useServer, form, json, login, testid, inputValue } = require('./_harness');

const ctx = useServer();

test('TC-UI-002 — the password field is declared as a masked input', async () => {
  const body = await (await fetch(`${ctx.base}/`)).text();
  const field = body.match(/<input[^>]*data-testid="password-input"[^>]*>/);

  assert.ok(field, 'no element with data-testid="password-input"');
  assert.match(field[0], /type="password"/);
  assert.match(field[0], /autocomplete="current-password"/);
  assert.equal(inputValue(body, 'password-input'), null);
});
```

## Change Log
| Version | Date | Author | Change | Reason |
| --- | --- | --- | --- | --- |
| 2 | 2026-09-14 | marc.riegel@nimbusforge.de | Migrated to the ISTQB case format; classified `semi-automated` and automated the attribute assertions | The visual assertion cannot be made headlessly, but the attributes that cause it can be |
| 1 | 2026-09-14 | marc.riegel@nimbusforge.de | Created | A login form must not display the password in clear text |

## Notes
`semi-automated` is deliberate. The script asserts the attributes that produce masking; the
final `**And**` step — that a browser actually renders mask characters — is confirmed by a
human at release time. Automating it would need a real browser, which this repo does not
have, and asserting the attribute alone while claiming to have tested the rendering would
overstate the coverage.
