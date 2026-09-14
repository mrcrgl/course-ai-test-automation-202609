---
id: TC-UI-003
title: Static stylesheet is served
area: UI
type: Positive
priority: Low
route: GET /style.css
automated: false
---

# TC-UI-003 — Static stylesheet is served

## Objective
Verify the static asset middleware serves `public/style.css` referenced by both pages.

## Preconditions
- The application is running at `http://localhost:3000`.

## Test Data
| Field | Value |
| --- | --- |
| URL | `http://localhost:3000/style.css` |

## Scenario

**Given** the application is running
**When** the client requests `GET /style.css`
**Then** the response status is `200`
**And** the `Content-Type` header is `text/css`
**And** the response body is not empty

## Expected Result
The stylesheet loads, so the login and success pages render styled.

## Notes
Guards against a broken `express.static` path after refactoring.
