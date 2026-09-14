---
id: TC-AUTH-008
title: Surrounding whitespace in the username is trimmed
area: Authentication
type: Boundary
priority: Medium
route: POST /login
automated: false
---

# TC-AUTH-008 — Surrounding whitespace in the username is trimmed

## Objective
Verify that leading and trailing whitespace in the username does not prevent a valid login.

## Preconditions
- The application is running at `http://localhost:3000`.
- The client has no `sid` session cookie.

## Test Data
| Field | Value |
| --- | --- |
| Username | `␣␣admin␣␣` (two spaces either side) |
| Password | `admin123` |

## Scenario

**Given** the user is on the login page at `/`
**And** the user has entered the username with surrounding spaces, `␣␣admin␣␣`
**And** the user has entered the password `admin123`
**When** the user submits the login form
**Then** the response status is `302` with header `Location: /success`
**And** following the redirect shows `admin` in the element with `data-testid="username"`
**And** the displayed username has no surrounding whitespace

## Expected Result
The padded username is trimmed and the login succeeds as `admin`.

## Notes
Documents intended behaviour: usernames are trimmed, passwords are not — contrast with [TC-AUTH-009].
