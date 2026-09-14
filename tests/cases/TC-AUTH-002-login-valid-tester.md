---
id: TC-AUTH-002
title: Successful login with the second valid account
area: Authentication
type: Positive
priority: High
route: POST /login
automated: false
---

# TC-AUTH-002 — Successful login with the second valid account

## Objective
Verify that authentication is not hard-wired to a single account and that the success page reflects the account that logged in.

## Preconditions
- The application is running at `http://localhost:3000`.
- The client has no `sid` session cookie.

## Test Data
| Field | Value |
| --- | --- |
| Username | `tester` |
| Password | `test123` |

## Scenario

**Given** the user is on the login page at `/`
**And** the user has entered the username `tester`
**And** the user has entered the password `test123`
**When** the user submits the login form
**Then** the response status is `302` with header `Location: /success`
**And** following the redirect returns status `200`
**And** the element with `data-testid="username"` contains `tester`
**And** it does not contain `admin`

## Expected Result
The `tester` account logs in and the success page greets `tester`.

## Notes
Pairs with [TC-AUTH-001]. Catches a hard-coded username on the success page.
