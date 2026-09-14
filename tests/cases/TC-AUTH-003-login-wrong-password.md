---
id: TC-AUTH-003
title: Login rejected for a known user with the wrong password
area: Authentication
type: Negative
priority: Critical
route: POST /login
automated: false
---

# TC-AUTH-003 — Login rejected for a known user with the wrong password

## Objective
Verify that a valid username combined with an incorrect password is rejected.

## Preconditions
- The application is running at `http://localhost:3000`.
- The client has no `sid` session cookie.

## Test Data
| Field | Value |
| --- | --- |
| Username | `admin` |
| Password | `wrongpassword` |

## Scenario

**Given** the user is on the login page at `/`
**And** the user has entered the username `admin`
**And** the user has entered the password `wrongpassword`
**When** the user submits the login form
**Then** the response status is `401`
**And** the login form is redisplayed
**And** the element with `data-testid="error-message"` reads `Invalid username or password.`
**And** no `sid` session cookie is set
**And** the user is not redirected to `/success`

## Expected Result
Access is denied and the user remains on the login page with an error message.

## Notes
Core negative path.
