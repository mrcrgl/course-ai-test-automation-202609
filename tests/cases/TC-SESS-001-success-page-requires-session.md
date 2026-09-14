---
id: TC-SESS-001
title: Success page is unreachable without a session
area: Session
type: Security
priority: Critical
route: GET /success
automated: false
---

# TC-SESS-001 — Success page is unreachable without a session

## Objective
Verify that the success page cannot be reached by navigating directly to its URL without logging in.

## Preconditions
- The application is running at `http://localhost:3000`.
- The client has no `sid` session cookie.

## Test Data
| Field | Value |
| --- | --- |
| URL | `http://localhost:3000/success` |

## Scenario

**Given** the client has never logged in and holds no session cookie
**When** the client requests `GET /success`
**Then** the response status is `302` with header `Location: /`
**And** the response body does not contain `Login successful`
**And** following the redirect shows the login page

## Expected Result
An unauthenticated visitor is sent back to the login page and sees no protected content.

## Notes
Primary access-control check. A `200` here is a critical defect.
