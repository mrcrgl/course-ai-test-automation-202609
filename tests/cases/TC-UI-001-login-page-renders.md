---
id: TC-UI-001
title: Login page renders with all form controls
area: UI
type: Positive
priority: High
route: GET /
automated: false
---

# TC-UI-001 — Login page renders with all form controls

## Objective
Verify the login page is served and exposes the username field, password field and submit button.

## Preconditions
- The application is running at `http://localhost:3000`.
- The client has no `sid` session cookie.

## Test Data
| Field | Value |
| --- | --- |
| URL | `http://localhost:3000/` |

## Scenario

**Given** the application is running and the client has no session cookie
**When** the client requests `GET /`
**Then** the response status is `200`
**And** the page contains a form with `data-testid="login-form"` posting to `/login` with method `POST`
**And** the page contains an input with `data-testid="username-input"`
**And** the page contains an input with `data-testid="password-input"`
**And** the page contains a button with `data-testid="login-button"`
**And** no element with `data-testid="error-message"` is present

## Expected Result
The login form is displayed in its initial, error-free state.

## Notes
Baseline smoke test — a failure here invalidates every other UI case.
