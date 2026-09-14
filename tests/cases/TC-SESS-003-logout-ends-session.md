---
id: TC-SESS-003
title: Logout ends the session and returns to the login page
area: Session
type: Positive
priority: High
route: POST /logout
automated: false
---

# TC-SESS-003 — Logout ends the session and returns to the login page

## Objective
Verify that the logout button terminates the session and clears the session cookie.

## Preconditions
- The application is running at `http://localhost:3000`.
- The client holds a valid `sid` cookie obtained by logging in as `admin` / `admin123`.

## Test Data
| Field | Value |
| --- | --- |
| Action | Submit the form containing `data-testid="logout-button"` |

## Scenario

**Given** the user is logged in as `admin` and is on the success page
**When** the user clicks the button with `data-testid="logout-button"`
**Then** the response status is `302` with header `Location: /`
**And** the response instructs the client to clear the `sid` cookie
**And** following the redirect displays the login form

## Expected Result
The user is logged out and returned to the login page.

## Notes
Cookie removal is observable via a `Set-Cookie: sid=; Expires=…` header.
