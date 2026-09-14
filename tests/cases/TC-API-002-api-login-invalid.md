---
id: TC-API-002
title: API login returns 401 for invalid credentials
area: API
type: Negative
priority: High
route: POST /api/login
automated: false
---

# TC-API-002 — API login returns 401 for invalid credentials

## Objective
Verify the JSON login endpoint rejects a wrong password with the correct status and error shape.

## Preconditions
- The application is running at `http://localhost:3000`.

## Test Data
| Field | Value |
| --- | --- |
| Header | `Content-Type: application/json` |
| Body | `{"username":"tester","password":"nope"}` |

## Scenario

**Given** the application is running
**When** the client sends `POST /api/login` with the body `{"username":"tester","password":"nope"}`
**Then** the response status is `401`
**And** the body equals `{"ok":false,"error":"Invalid username or password."}`
**And** the body does not contain the correct password

## Expected Result
The credentials are rejected without leaking which part was wrong.

## Notes
Repeat with an unknown username and confirm the response is byte-identical — see [TC-SEC-002].
