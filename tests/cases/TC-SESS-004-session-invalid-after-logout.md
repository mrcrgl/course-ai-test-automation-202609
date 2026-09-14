---
id: TC-SESS-004
title: Session identifier is rejected after logout
area: Session
type: Security
priority: Critical
route: GET /success
automated: false
---

# TC-SESS-004 — Session identifier is rejected after logout

## Objective
Verify that the session is invalidated server-side on logout, so a captured cookie cannot be replayed.

## Preconditions
- The application is running at `http://localhost:3000`.
- The tester has recorded the `sid` value issued during a successful login as `admin`.

## Test Data
| Field | Value |
| --- | --- |
| Cookie | `sid=<value captured before logout>` |

## Scenario

**Given** the user logged in as `admin` and the `sid` value was recorded
**And** the user has logged out via `POST /logout`
**When** a client replays the recorded `sid` cookie against `GET /success`
**Then** the response status is `302` with header `Location: /`
**And** the response body does not contain `Login successful`

## Expected Result
The old session identifier is no longer accepted; the server discarded it rather than relying on cookie deletion alone.

## Notes
Distinct from [TC-SESS-003]: that case checks the client is told to drop the cookie, this one checks the server stopped honouring it.
