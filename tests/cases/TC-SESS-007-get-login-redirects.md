---
id: TC-SESS-007
title: GET /login redirects to the login page root
area: Session
type: Positive
priority: Low
route: GET /login
automated: false
---

# TC-SESS-007 — GET /login redirects to the login page root

## Objective
Verify that navigating to `/login` with a GET request (for example via browser back or a bookmark) does not error.

## Preconditions
- The application is running at `http://localhost:3000`.

## Test Data
| Field | Value |
| --- | --- |
| URL | `http://localhost:3000/login` |

## Scenario

**Given** the application is running
**When** the client requests `GET /login`
**Then** the response status is `302` with header `Location: /`
**And** the response status is not `404`
**And** following the redirect displays the login form

## Expected Result
`/login` is a valid entry point for GET and resolves to the login form.

## Notes
`/login` accepts POST only for submissions; GET is a convenience redirect.
