---
id: TC-SEC-001
title: Submitted username is HTML-escaped when echoed back
area: Security
type: Security
priority: High
route: POST /login
automated: false
---

# TC-SEC-001 — Submitted username is HTML-escaped when echoed back

## Objective
Verify that a username containing HTML is escaped when redisplayed, so injected markup cannot execute (reflected XSS).

## Preconditions
- The application is running at `http://localhost:3000`.
- The client has no `sid` session cookie.

## Test Data
| Field | Value |
| --- | --- |
| Username | `<script>alert(1)</script>` |
| Password | `x` |

## Scenario

**Given** the user is on the login page at `/`
**And** the user has entered the username `<script>alert(1)</script>`
**And** the user has entered the password `x`
**When** the user submits the login form
**Then** the response status is `401`
**And** the response body contains the escaped text `&lt;script&gt;alert(1)&lt;/script&gt;`
**And** the response body does not contain an executable `<script>alert(1)</script>` tag
**And** no JavaScript dialog is triggered in the browser

## Expected Result
The injected markup is rendered as literal text inside the username field, not executed.

## Notes
Repeat with `"><img src=x onerror=alert(1)>` to confirm the attribute context is escaped too.
