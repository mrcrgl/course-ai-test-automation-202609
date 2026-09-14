---
id: TC-AUTH-004
title: Login rejected for an unknown username
area: Authentication
type: Negative
priority: High
route: POST /login
automated: false
---

# TC-AUTH-004 — Login rejected for an unknown username

## Objective
Verify that a username that does not exist in the static credential list is rejected.

## Preconditions
- The application is running at `http://localhost:3000`.
- The client has no `sid` session cookie.

## Test Data
| Field | Value |
| --- | --- |
| Username | `nobody` |
| Password | `anything` |

## Scenario

**Given** the user is on the login page at `/`
**And** the user has entered the username `nobody`, which is not a configured account
**And** the user has entered the password `anything`
**When** the user submits the login form
**Then** the response status is `401`
**And** the element with `data-testid="error-message"` reads `Invalid username or password.`
**And** no `sid` session cookie is set

## Expected Result
Access is denied with the same generic message used for a wrong password.

## Notes
See [TC-SEC-002] for the user-enumeration aspect of the shared message.
