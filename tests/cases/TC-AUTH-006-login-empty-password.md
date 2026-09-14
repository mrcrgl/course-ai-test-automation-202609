---
id: TC-AUTH-006
title: Login rejected when the password is empty
area: Authentication
type: Negative
priority: High
route: POST /login
automated: false
---

# TC-AUTH-006 — Login rejected when the password is empty

## Objective
Verify that a valid username with no password is treated as missing input, not as an authentication attempt.

## Preconditions
- The application is running at `http://localhost:3000`.
- The client has no `sid` session cookie.

## Test Data
| Field | Value |
| --- | --- |
| Username | `admin` |
| Password | *(empty)* |

## Scenario

**Given** the user is on the login page at `/`
**And** the user has entered the username `admin`
**And** the user has left the password field empty
**When** the user submits the login form
**Then** the response status is `400`
**And** the element with `data-testid="error-message"` reads `Username and password are required.`
**And** no `sid` session cookie is set

## Expected Result
The request is rejected as incomplete before any credential comparison happens.

## Notes
Guards against an empty password ever matching a blank or undefined stored value.
