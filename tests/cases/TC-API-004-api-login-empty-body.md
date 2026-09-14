---
id: TC-API-004
title: API login handles an empty or absent body
area: API
type: Negative
priority: Medium
route: POST /api/login
automated: false
---

# TC-API-004 — API login handles an empty or absent body

## Objective
Verify the endpoint responds with a validation error rather than a server error when no payload is supplied.

## Preconditions
- The application is running at `http://localhost:3000`.

## Test Data
| Field | Value |
| --- | --- |
| Body A | `{}` with `Content-Type: application/json` |
| Body B | *(no body, no Content-Type)* |

## Scenario

**Given** the application is running
**When** the client sends `POST /api/login` with the body `{}`
**Then** the response status is `400`
**And** the body equals `{"ok":false,"error":"Username and password are required."}`
**When** the client sends `POST /api/login` with no body at all
**Then** the response status is `400`
**And** the response status is not `500`

## Expected Result
Missing payloads are handled as bad requests; the server does not crash or return a stack trace.

## Notes
Robustness check — assert explicitly that no `5xx` is returned.
