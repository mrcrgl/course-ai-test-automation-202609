---
id: TC-API-001
title: API login returns success for valid credentials
area: API
type: Positive
priority: High
route: POST /api/login
automated: false
---

# TC-API-001 — API login returns success for valid credentials

## Objective
Verify the JSON login endpoint accepts valid credentials and echoes the authenticated username.

## Preconditions
- The application is running at `http://localhost:3000`.

## Test Data
| Field | Value |
| --- | --- |
| Header | `Content-Type: application/json` |
| Body | `{"username":"tester","password":"test123"}` |

## Scenario

**Given** the application is running
**When** the client sends `POST /api/login` with the body `{"username":"tester","password":"test123"}`
**Then** the response status is `200`
**And** the `Content-Type` is `application/json`
**And** the body equals `{"ok":true,"username":"tester"}`
**And** the body contains no password value

## Expected Result
The endpoint confirms the credentials and identifies the account.

## Notes
This endpoint validates credentials only; it does not establish a session cookie.
