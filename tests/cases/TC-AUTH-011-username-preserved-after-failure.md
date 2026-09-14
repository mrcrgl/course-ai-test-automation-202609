---
id: TC-AUTH-011
title: Username is preserved after a failed login attempt
area: Authentication
type: Positive
priority: Medium
route: POST /login
automated: false
---

# TC-AUTH-011 — Username is preserved after a failed login attempt

## Objective
Verify that a rejected login redisplays the submitted username so the user only has to retype the password.

## Preconditions
- The application is running at `http://localhost:3000`.
- The client has no `sid` session cookie.

## Test Data
| Field | Value |
| --- | --- |
| Username | `tester` |
| Password | `wrongpassword` |

## Scenario

**Given** the user is on the login page at `/`
**And** the user has entered the username `tester`
**And** the user has entered the password `wrongpassword`
**When** the user submits the login form
**Then** the response status is `401`
**And** the input with `data-testid="username-input"` has the value `tester`
**And** the input with `data-testid="password-input"` is empty
**And** the element with `data-testid="error-message"` is displayed

## Expected Result
The username survives the failed attempt; the password field is cleared.

## Notes
The password must never be echoed back into the HTML.
