---
id: TC-SESS-002
title: Logged-in user is redirected away from the login page
area: Session
type: Positive
priority: Medium
route: GET /
automated: false
---

# TC-SESS-002 — Logged-in user is redirected away from the login page

## Objective
Verify that an authenticated user visiting `/` is sent to the success page instead of the login form.

## Preconditions
- The application is running at `http://localhost:3000`.
- The client holds a valid `sid` cookie obtained by logging in as `admin` / `admin123`.

## Test Data
| Field | Value |
| --- | --- |
| URL | `http://localhost:3000/` |

## Scenario

**Given** the user has successfully logged in as `admin`
**When** the user navigates to `/`
**Then** the response status is `302` with header `Location: /success`
**And** the login form is not displayed

## Expected Result
An already-authenticated user cannot land back on the login form.

## Notes
Depends on [TC-AUTH-001] passing.
