---
id: TC-AUTH-005
title: Login rejected when both fields are empty
area: Authentication
type: Negative
priority: High
route: POST /login
automated: false
---

# TC-AUTH-005 — Login rejected when both fields are empty

## Objective
Verify that submitting an empty form produces a validation error rather than an authentication attempt.

## Preconditions
- The application is running at `http://localhost:3000`.
- The client has no `sid` session cookie.

## Test Data
| Field | Value |
| --- | --- |
| Username | *(empty)* |
| Password | *(empty)* |

## Scenario

**Given** the user is on the login page at `/`
**And** both the username and the password field are empty
**When** the user submits the login form
**Then** the response status is `400`
**And** the element with `data-testid="error-message"` reads `Username and password are required.`
**And** no `sid` session cookie is set

## Expected Result
A validation error is shown and the status distinguishes missing input (`400`) from bad credentials (`401`).

## Notes
The distinct status code is the point of this case — assert it explicitly.
