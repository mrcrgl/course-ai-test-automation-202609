---
id: TC-SESS-005
title: Unknown session cookie value is rejected
area: Session
type: Security
priority: High
route: GET /success
automated: false
---

# TC-SESS-005 — Unknown session cookie value is rejected

## Objective
Verify that an arbitrary, never-issued `sid` value does not grant access to the success page.

## Preconditions
- The application is running at `http://localhost:3000`.

## Test Data
| Field | Value |
| --- | --- |
| Cookie | `sid=not-a-real-session-id` |

## Scenario

**Given** a client that has never authenticated
**And** the client sets the cookie `sid=not-a-real-session-id`
**When** the client requests `GET /success`
**Then** the response status is `302` with header `Location: /`
**And** the response body does not contain `Login successful`

## Expected Result
Only session identifiers issued by the server are honoured.

## Notes
Repeat with an empty value (`sid=`) and with a plausible-looking random string.
