# Test cases

One test case per file, written in Given/When/Then. Each file is simultaneously a
specification, a traceability record, and the home of the script that executes it.

## Naming

```
TC-<AREA>-<NNN>-<kebab-case-slug>.md
```

`AREA` is one of `UI`, `AUTH`, `SESS`, `API`, `SEC`, `CI`. `NNN` is zero-padded, unique within
its area, and never reused.

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
| [TC-CI-001](TC-CI-001-workflow-triggers-on-pull-requests.md) | The check starts on every pull request against master | functional | high | regression | automated |
| [TC-CI-002](TC-CI-002-workflow-runs-the-defined-suite.md) | The check runs the suite the way the repository defines it | functional | critical | regression | automated |
| [TC-CI-003](TC-CI-003-suite-runs-on-node-20-and-24.md) | The check runs on the Node versions the project supports | portability | medium | regression | automated |
| [TC-CI-004](TC-CI-004-malformed-case-fails-validator.md) | A malformed case file turns the check red | functional | high | regression | automated |
| [TC-CI-005](TC-CI-005-run-report-uploaded-as-artifact.md) | The run report is attached to the run as a downloadable artifact | functional | medium | regression | automated |
| [TC-CI-006](TC-CI-006-verdict-in-job-summary.md) | The verdict and the case counts appear in the job summary | functional | medium | regression | automated |
| [TC-CI-007](TC-CI-007-workflow-writes-nothing-back.md) | The workflow may only read the repository and writes nothing back | security | medium | security | automated |
| [TC-CI-008](TC-CI-008-superseded-runs-are-cancelled.md) | A run superseded by a newer commit is cancelled | functional | low | regression | automated |
| [TC-CI-009](TC-CI-009-check-adds-no-dependency.md) | The check adds nothing to the application | maintainability | medium | regression | automated |
| [TC-SEC-001](TC-SEC-001-username-is-html-escaped.md) | A script tag in the username is escaped, not executed | security | critical | security | automated |
| [TC-SEC-002](TC-SEC-002-error-message-does-not-enumerate-users.md) | A wrong password and an unknown user are indistinguishable | security | medium | security | automated |
| [TC-SEC-003](TC-SEC-003-attribute-context-escaped.md) | A quote in the username cannot break out of the value attribute | security | critical | security | automated |
| [TC-SEC-004](TC-SEC-004-password-never-echoed.md) | A submitted password is never echoed back in a response | security | high | security | automated |
| [TC-SEC-005](TC-SEC-005-unknown-identifier-returns-404.md) | An unknown identifier returns 404 without leaking internals | security | medium | security | automated |
| [TC-SEC-006](TC-SEC-006-traversal-identifier-refused.md) | A traversal identifier cannot read outside the test directories | security | critical | security | automated |
| [TC-SEC-007](TC-SEC-007-case-script-payload-escaped.md) | A script payload stored in a case file is displayed as text | security | high | security | automated |
| [TC-SEC-008](TC-SEC-008-case-attribute-payload-escaped.md) | An attribute-breakout payload in a case file is displayed as text | security | high | security | automated |
| [TC-SEC-009](TC-SEC-009-browsing-never-writes.md) | Browsing the pages never writes to the test directories | security | medium | security | automated |
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
| [TC-SESS-011](TC-SESS-011-browse-pages-require-session.md) | The case and run browsers are unreachable without a session | security | high | security | automated |
| [TC-UI-001](TC-UI-001-login-page-renders.md) | The login page renders with all form controls | functional | high | smoke | automated |
| [TC-UI-002](TC-UI-002-password-field-masked.md) | The password field is a masked input | usability | medium | regression | semi-automated |
| [TC-UI-003](TC-UI-003-stylesheet-served.md) | The static stylesheet is served | functional | low | regression | automated |
| [TC-UI-004](TC-UI-004-demo-credentials-hint.md) | The login page shows the demo credentials hint | functional | low | regression | automated |
| [TC-UI-005](TC-UI-005-unknown-path-returns-404.md) | An unknown path returns 404 without leaking internals | security | medium | security | automated |
| [TC-UI-006](TC-UI-006-success-page-links-to-browsers.md) | The success page links to the case and run browsers | functional | medium | regression | automated |
| [TC-UI-007](TC-UI-007-case-list-shows-classification.md) | The case list shows every case with its classification | functional | high | regression | automated |
| [TC-UI-008](TC-UI-008-case-detail-shows-specification.md) | The case detail page shows the whole specification | functional | high | regression | automated |
| [TC-UI-009](TC-UI-009-run-list-newest-first.md) | The run list shows every recorded run, newest first | functional | high | regression | automated |
| [TC-UI-010](TC-UI-010-run-detail-shows-report.md) | The run detail page shows the whole report | functional | high | regression | automated |
| [TC-UI-011](TC-UI-011-run-links-to-its-cases.md) | A run report links to each case it executed | functional | medium | regression | automated |
| [TC-UI-012](TC-UI-012-case-links-to-recent-results.md) | A case links back to its most recent recorded results | functional | medium | regression | automated |
| [TC-UI-013](TC-UI-013-empty-run-directory.md) | An empty run directory renders an empty state, not an error | reliability | medium | regression | automated |
| [TC-UI-014](TC-UI-014-unreadable-case-is-flagged.md) | An unreadable case file is flagged, not dropped | reliability | medium | regression | automated |

60 cases, all automated (TC-UI-002 is `semi-automated`: its final visual step is manual).

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
server start-up and request helpers, and `tests/scripts/_workflow.js` for reading the CI
workflow file.

## Test basis

The cases covering [issue #1](https://github.com/mrcrgl/course-ai-test-automation-202609/issues/1)
and [issue #3](https://github.com/mrcrgl/course-ai-test-automation-202609/issues/3) trace to
their acceptance criteria. The login application itself predates any ticket, so its
security behaviour traces to BSI practices and the rest is `derived` from the
implementation. When tickets arrive for those, replace the `derived` references with the
ACs — the `demand` field in each reference records what the case currently assumes is
required.

| Reference type | References |
| --- | --- |
| `bsi-practice` | 31 |
| `derived` | 6 |
| `acceptance-criterion` | 24 |
