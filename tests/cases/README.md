# Test cases

One test case per file, written in Given/When/Then. Every file follows the same
structure — see [Format](#format) below.

## Naming

```
TC-<AREA>-<NNN>-<kebab-case-slug>.md
```

`AREA` is one of `UI`, `AUTH`, `SESS`, `API`, `SEC`. `NNN` is a zero-padded
sequence number, unique within its area and never reused.

## Index

| ID | Title | Area | Type | Priority |
| --- | --- | --- | --- | --- |
| [TC-UI-001](TC-UI-001-login-page-renders.md) | Login page renders with all form controls | UI | Positive | High |
| [TC-UI-002](TC-UI-002-password-field-masked.md) | Password field masks its input | UI | Positive | Medium |
| [TC-UI-003](TC-UI-003-stylesheet-served.md) | Static stylesheet is served | UI | Positive | Low |
| [TC-UI-004](TC-UI-004-demo-credentials-hint.md) | Demo credentials hint is shown on the login page | UI | Positive | Low |
| [TC-AUTH-001](TC-AUTH-001-login-valid-admin.md) | Successful login with valid admin credentials | Authentication | Positive | Critical |
| [TC-AUTH-002](TC-AUTH-002-login-valid-tester.md) | Successful login with the second valid account | Authentication | Positive | High |
| [TC-AUTH-003](TC-AUTH-003-login-wrong-password.md) | Login rejected for a known user with the wrong password | Authentication | Negative | Critical |
| [TC-AUTH-004](TC-AUTH-004-login-unknown-username.md) | Login rejected for an unknown username | Authentication | Negative | High |
| [TC-AUTH-005](TC-AUTH-005-login-both-fields-empty.md) | Login rejected when both fields are empty | Authentication | Negative | High |
| [TC-AUTH-006](TC-AUTH-006-login-empty-password.md) | Login rejected when the password is empty | Authentication | Negative | High |
| [TC-AUTH-007](TC-AUTH-007-login-empty-username.md) | Login rejected when the username is empty | Authentication | Negative | Medium |
| [TC-AUTH-008](TC-AUTH-008-username-whitespace-trimmed.md) | Surrounding whitespace in the username is trimmed | Authentication | Boundary | Medium |
| [TC-AUTH-009](TC-AUTH-009-password-whitespace-significant.md) | Surrounding whitespace in the password is significant | Authentication | Boundary | Medium |
| [TC-AUTH-010](TC-AUTH-010-username-case-sensitive.md) | Username matching is case-sensitive | Authentication | Negative | Medium |
| [TC-AUTH-011](TC-AUTH-011-username-preserved-after-failure.md) | Username is preserved after a failed login attempt | Authentication | Positive | Medium |
| [TC-SESS-001](TC-SESS-001-success-page-requires-session.md) | Success page is unreachable without a session | Session | Security | Critical |
| [TC-SESS-002](TC-SESS-002-logged-in-user-redirected-from-login.md) | Logged-in user is redirected away from the login page | Session | Positive | Medium |
| [TC-SESS-003](TC-SESS-003-logout-ends-session.md) | Logout ends the session and returns to the login page | Session | Positive | High |
| [TC-SESS-004](TC-SESS-004-session-invalid-after-logout.md) | Session identifier is rejected after logout | Session | Security | Critical |
| [TC-SESS-005](TC-SESS-005-forged-session-cookie-rejected.md) | Unknown session cookie value is rejected | Session | Security | High |
| [TC-SESS-006](TC-SESS-006-session-cookie-attributes.md) | Session cookie is issued with HttpOnly and SameSite | Session | Security | High |
| [TC-SESS-007](TC-SESS-007-get-login-redirects.md) | GET /login redirects to the login page root | Session | Positive | Low |
| [TC-API-001](TC-API-001-api-login-valid.md) | API login returns success for valid credentials | API | Positive | High |
| [TC-API-002](TC-API-002-api-login-invalid.md) | API login returns 401 for invalid credentials | API | Negative | High |
| [TC-API-003](TC-API-003-api-login-missing-fields.md) | API login returns 400 when a field is missing | API | Negative | Medium |
| [TC-API-004](TC-API-004-api-login-empty-body.md) | API login handles an empty or absent body | API | Negative | Medium |
| [TC-SEC-001](TC-SEC-001-username-is-html-escaped.md) | Submitted username is HTML-escaped when echoed back | Security | Security | High |
| [TC-SEC-002](TC-SEC-002-error-message-does-not-enumerate-users.md) | Error message does not reveal whether the username exists | Security | Security | Medium |

28 cases.

## Format

Each case file contains exactly these parts, in this order.

1. **YAML front matter** with all seven keys, in this order:
   - `id` — matches the filename prefix and the `#` heading.
   - `title` — matches the `#` heading and the index row.
   - `area` — `UI` | `Authentication` | `Session` | `API` | `Security`.
   - `type` — `Positive` | `Negative` | `Boundary` | `Security`.
   - `priority` — `Critical` | `High` | `Medium` | `Low`.
   - `route` — the HTTP method and path under test.
   - `automated` — `true` once an automated test covers the case.
2. `# <id> — <title>`
3. `## Objective` — one sentence stating what the case proves.
4. `## Preconditions` — bullet list of required starting state.
5. `## Test Data` — two-column table (`Field` | `Value`).
6. `## Scenario` — Given/When/Then, one step per line, each keyword bold.
   `**Given**` and `**When**` steps may be extended with `**And**`; every
   assertion is a `**Then**` or a following `**And**`.
7. `## Expected Result` — the outcome in prose, one or two sentences.
8. `## Notes` — rationale, variations, or dependencies on other cases.

### Template

```markdown
---
id: TC-AREA-000
title: Short imperative statement of the behaviour
area: Authentication
type: Positive
priority: Medium
route: POST /login
automated: false
---

# TC-AREA-000 — Short imperative statement of the behaviour

## Objective
What this case proves.

## Preconditions
- The application is running at `http://localhost:3000`.

## Test Data
| Field | Value |
| --- | --- |
| Username | `admin` |

## Scenario

**Given** some starting state
**And** some additional state
**When** the action under test occurs
**Then** the first observable outcome holds
**And** the second observable outcome holds

## Expected Result
Prose summary of the outcome.

## Notes
Anything a tester should know before running this.
```

## Status

All 28 cases describe behaviour observed against the running application on
2026-09-14; none is currently automated (`automated: false` throughout). Set
`automated: true` in a case's front matter when an automated test covers it.
