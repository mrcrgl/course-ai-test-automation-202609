---
id: TC-UI-004
title: Demo credentials hint is shown on the login page
area: UI
type: Positive
priority: Low
route: GET /
automated: false
---

# TC-UI-004 — Demo credentials hint is shown on the login page

## Objective
Verify the login page displays the demo credentials hint that the exercise relies on.

## Preconditions
- The application is running at `http://localhost:3000`.

## Test Data
| Field | Value |
| --- | --- |
| Expected hint text | `Demo credentials: admin / admin123` |

## Scenario

**Given** the user is on the login page at `/`
**When** the page has finished loading
**Then** a hint element is visible below the form
**And** it names the username `admin` and the password `admin123`

## Expected Result
A tester can read valid credentials directly from the page.

## Notes
This hint is intentional for a demo app and would be a defect in a production system.
