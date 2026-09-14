---
id: TC-AUTH-007
title: Login rejected when the username is empty
area: Authentication
type: Negative
priority: Medium
route: POST /login
automated: false
---

# TC-AUTH-007 — Login rejected when the username is empty

## Objective
Verify that a password with no username is treated as missing input.

## Preconditions
- The application is running at `http://localhost:3000`.
- The client has no `sid` session cookie.

## Test Data
| Field | Value |
| --- | --- |
| Username | *(empty)* |
| Password | `admin123` |

## Scenario

**Given** the user is on the login page at `/`
**And** the user has left the username field empty
**And** the user has entered the password `admin123`
**When** the user submits the login form
**Then** the response status is `400`
**And** the element with `data-testid="error-message"` reads `Username and password are required.`
**And** no `sid` session cookie is set

## Expected Result
The request is rejected as incomplete.

## Notes
Mirror image of [TC-AUTH-006].
