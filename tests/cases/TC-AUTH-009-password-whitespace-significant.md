---
id: TC-AUTH-009
title: Surrounding whitespace in the password is significant
area: Authentication
type: Boundary
priority: Medium
route: POST /login
automated: false
---

# TC-AUTH-009 — Surrounding whitespace in the password is significant

## Objective
Verify that the password is compared verbatim and is not trimmed.

## Preconditions
- The application is running at `http://localhost:3000`.
- The client has no `sid` session cookie.

## Test Data
| Field | Value |
| --- | --- |
| Username | `admin` |
| Password | `␣admin123␣` (one space either side) |

## Scenario

**Given** the user is on the login page at `/`
**And** the user has entered the username `admin`
**And** the user has entered the password with surrounding spaces, `␣admin123␣`
**When** the user submits the login form
**Then** the response status is `401`
**And** the element with `data-testid="error-message"` reads `Invalid username or password.`
**And** no `sid` session cookie is set

## Expected Result
The padded password does not match and the login is rejected.

## Notes
Deliberate asymmetry with [TC-AUTH-008]; whitespace can be a legitimate part of a password.
