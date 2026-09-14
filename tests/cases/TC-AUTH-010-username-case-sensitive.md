---
id: TC-AUTH-010
title: Username matching is case-sensitive
area: Authentication
type: Negative
priority: Medium
route: POST /login
automated: false
---

# TC-AUTH-010 — Username matching is case-sensitive

## Objective
Verify that a username differing only in letter case is not accepted.

## Preconditions
- The application is running at `http://localhost:3000`.
- The client has no `sid` session cookie.

## Test Data
| Field | Value |
| --- | --- |
| Username | `Admin` |
| Password | `admin123` |

## Scenario

**Given** the user is on the login page at `/`
**And** the user has entered the username `Admin` with a capital `A`
**And** the user has entered the otherwise correct password `admin123`
**When** the user submits the login form
**Then** the response status is `401`
**And** the element with `data-testid="error-message"` reads `Invalid username or password.`
**And** no `sid` session cookie is set

## Expected Result
The login is rejected because `Admin` is not a configured account.

## Notes
Documents current behaviour. If case-insensitive usernames are ever required, this case must be rewritten, not deleted.
