---
id: TC-API-003
title: API login returns 400 when a field is missing
area: API
type: Negative
priority: Medium
route: POST /api/login
automated: false
---

# TC-API-003 — API login returns 400 when a field is missing

## Objective
Verify the JSON endpoint distinguishes incomplete input (`400`) from rejected credentials (`401`).

## Preconditions
- The application is running at `http://localhost:3000`.

## Test Data
| Field | Value |
| --- | --- |
| Header | `Content-Type: application/json` |
| Body A | `{"username":"admin"}` |
| Body B | `{"password":"admin123"}` |

## Scenario

**Given** the application is running
**When** the client sends `POST /api/login` with the body `{"username":"admin"}`
**Then** the response status is `400`
**And** the body equals `{"ok":false,"error":"Username and password are required."}`
**When** the client sends `POST /api/login` with the body `{"password":"admin123"}`
**Then** the response status is `400`
**And** the body equals `{"ok":false,"error":"Username and password are required."}`

## Expected Result
Both incomplete payloads are rejected as bad requests, not as failed authentication.

## Notes
API counterpart of [TC-AUTH-006] and [TC-AUTH-007].
