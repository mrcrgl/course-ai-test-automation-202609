# Test cases

One test case per file, written in Given/When/Then. Each file is simultaneously a
specification, a traceability record, and the home of the script that executes it.

## Naming

```
TC-<AREA>-<NNN>-<kebab-case-slug>.md
```

`AREA` is one of `UI`, `AUTH`, `SESS`, `API`, `SEC`. `NNN` is zero-padded, unique within its
area, and never reused.

## Index

| ID | Title | Type | Priority | Suite | Automation |
| --- | --- | --- | --- | --- | --- |
| [TC-API-001](TC-API-001-api-login-valid.md) | The API accepts valid credentials | functional | high | regression | automated |
| [TC-API-002](TC-API-002-api-login-invalid.md) | The API rejects invalid credentials with 401 | security | critical | security | automated |
| [TC-API-003](TC-API-003-api-login-missing-fields.md) | The API rejects an incomplete payload with 400 | functional | medium | regression | automated |
| [TC-API-004](TC-API-004-api-login-empty-body.md) | The API handles an empty or absent body without failing | reliability | medium | regression | automated |
| [TC-API-005](TC-API-005-api-login-grants-no-session.md) | A successful API login grants no session | security | high | security | automated |
| [TC-API-006](TC-API-006-api-login-rejects-get.md) | The API login endpoint is not exposed over GET | security | medium | security | automated |
| [TC-AUTH-001](TC-AUTH-001-login-valid-admin.md) | Valid admin credentials authenticate and reach the success page | functional | critical | smoke | automated |
| [TC-AUTH-002](TC-AUTH-002-login-valid-tester.md) | The second account logs in and is named on the success page | functional | high | regression | automated |
| [TC-AUTH-003](TC-AUTH-003-login-wrong-password.md) | Login is rejected for a known user with the wrong password | security | critical | security | automated |
| [TC-AUTH-004](TC-AUTH-004-login-unknown-username.md) | Login is rejected for an unknown username | security | critical | security | automated |
| [TC-AUTH-005](TC-AUTH-005-login-both-fields-empty.md) | Login is rejected when both fields are empty | functional | medium | regression | automated |
| [TC-AUTH-006](TC-AUTH-006-login-empty-password.md) | Login is rejected when the password is empty | security | high | regression | automated |
| [TC-AUTH-007](TC-AUTH-007-login-empty-username.md) | Login is rejected when the username is empty | functional | medium | regression | automated |
| [TC-AUTH-008](TC-AUTH-008-username-whitespace-trimmed.md) | Surrounding whitespace in the username is trimmed | functional | medium | regression | automated |
| [TC-AUTH-009](TC-AUTH-009-password-whitespace-significant.md) | Surrounding whitespace in the password is significant | security | high | security | automated |
| [TC-AUTH-010](TC-AUTH-010-username-case-sensitive.md) | Username matching is case-sensitive | security | medium | regression | automated |
| [TC-AUTH-011](TC-AUTH-011-username-preserved-after-failure.md) | The username survives a failed attempt but the password does not | usability | medium | regression | automated |
| [TC-SEC-001](TC-SEC-001-username-is-html-escaped.md) | A script tag in the username is escaped, not executed | security | critical | security | automated |
| [TC-SEC-002](TC-SEC-002-error-message-does-not-enumerate-users.md) | A wrong password and an unknown user are indistinguishable | security | medium | security | automated |
| [TC-SEC-003](TC-SEC-003-attribute-context-escaped.md) | A quote in the username cannot break out of the value attribute | security | critical | security | automated |
| [TC-SEC-004](TC-SEC-004-password-never-echoed.md) | A submitted password is never echoed back in a response | security | high | security | automated |
| [TC-SESS-001](TC-SESS-001-success-page-requires-session.md) | The success page is unreachable without a session | security | critical | security | automated |
| [TC-SESS-002](TC-SESS-002-logged-in-user-redirected-from-login.md) | A logged-in user is redirected away from the login page | functional | medium | regression | automated |
| [TC-SESS-003](TC-SESS-003-logout-ends-session.md) | Logout clears the cookie and returns to the login page | functional | high | regression | automated |
| [TC-SESS-004](TC-SESS-004-session-invalid-after-logout.md) | A session identifier is rejected after logout | security | critical | security | automated |
| [TC-SESS-005](TC-SESS-005-forged-session-cookie-rejected.md) | A session cookie the server never issued is rejected | security | critical | security | automated |
| [TC-SESS-006](TC-SESS-006-session-cookie-attributes.md) | The session cookie is issued with HttpOnly, SameSite and Path | security | high | security | automated |
| [TC-SESS-007](TC-SESS-007-get-login-redirects.md) | GET /login redirects to the login page instead of 404 | usability | low | regression | automated |
| [TC-SESS-008](TC-SESS-008-distinct-session-per-login.md) | Every login is issued a distinct session identifier | security | high | security | automated |
| [TC-SESS-009](TC-SESS-009-logout-does-not-affect-other-sessions.md) | Logging out of one session leaves other sessions untouched | security | high | security | automated |
| [TC-SESS-010](TC-SESS-010-logout-without-session.md) | Logging out without a session is handled gracefully | reliability | low | regression | automated |
| [TC-UI-001](TC-UI-001-login-page-renders.md) | The login page renders with all form controls | functional | high | smoke | automated |
| [TC-UI-002](TC-UI-002-password-field-masked.md) | The password field is a masked input | usability | medium | regression | semi-automated |
| [TC-UI-003](TC-UI-003-stylesheet-served.md) | The static stylesheet is served | functional | low | regression | automated |
| [TC-UI-004](TC-UI-004-demo-credentials-hint.md) | The login page shows the demo credentials hint | functional | low | regression | automated |
| [TC-UI-005](TC-UI-005-unknown-path-returns-404.md) | An unknown path returns 404 without leaking internals | security | medium | security | automated |

36 cases, all automated (TC-UI-002 is `semi-automated`: its final visual step is manual).

## Format

The format is normative and defined by the `write-test-case` skill — do not hand-roll a
case file:

| What | Where |
| --- | --- |
| Full field and section specification | `.claude/skills/write-test-case/references/case-format.md` |
| BSI-derived practices to reference | `.claude/skills/write-test-case/references/bsi-200-3-practices.md` |
| Skeleton to copy | `.claude/skills/write-test-case/templates/test-case.md` |
| Worked example | [TC-AUTH-003](TC-AUTH-003-login-wrong-password.md) |

Every case traces to a ticket acceptance criterion or a BSI practice, carries a change log,
and embeds the script that executes it.

## Running

```bash
npm test                                                       # execute the case scripts
npm run test:report                                            # execute and record a report
bash .claude/skills/write-test-case/scripts/validate-cases.sh  # check the case files
```

`npm run test:report` writes a dated record of the run to [`../runs/`](../runs/), including
per-case latency and the commit it ran against.

Scripts live in `tests/scripts/`, one per case, sharing `tests/scripts/_harness.js` for
server start-up and request helpers.

## Test basis

No ticket exists for this application yet, so no case references an acceptance criterion.
Security behaviour traces to BSI practices; the rest is `derived` from the implementation.
When tickets arrive, replace the `derived` references with the ACs — the `demand` field in
each reference records what the case currently assumes is required.

| Reference type | Cases |
| --- | --- |
| `bsi-practice` | 30 |
| `derived` | 6 |
| `acceptance-criterion` | 0 |
