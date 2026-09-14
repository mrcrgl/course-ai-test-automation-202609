---
id: TC-UI-002
title: Password field masks its input
area: UI
type: Positive
priority: Medium
route: GET /
automated: false
---

# TC-UI-002 — Password field masks its input

## Objective
Verify the password input uses `type="password"` so the typed value is not shown on screen.

## Preconditions
- The application is running at `http://localhost:3000`.

## Test Data
| Field | Value |
| --- | --- |
| Password typed | `admin123` |

## Scenario

**Given** the user is on the login page at `/`
**When** the user types `admin123` into the field with `data-testid="password-input"`
**Then** the field has attribute `type="password"`
**And** the characters are rendered as mask characters, not as plain text
**And** the field has `autocomplete="current-password"`

## Expected Result
The password value is visually masked in the browser.

## Notes
Requires a real browser; the attribute alone can be asserted at HTML level.
