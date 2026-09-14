---
id: TC-SESS-006
title: Session cookie is issued with HttpOnly and SameSite
area: Session
type: Security
priority: High
route: POST /login
automated: false
---

# TC-SESS-006 — Session cookie is issued with HttpOnly and SameSite

## Objective
Verify the session cookie carries the attributes that block script access and cross-site submission.

## Preconditions
- The application is running at `http://localhost:3000`.
- The client has no `sid` session cookie.

## Test Data
| Field | Value |
| --- | --- |
| Username | `admin` |
| Password | `admin123` |

## Scenario

**Given** the user is on the login page at `/`
**When** the user logs in with valid credentials
**Then** the response carries a `Set-Cookie` header for `sid`
**And** the header includes the `HttpOnly` attribute
**And** the header includes `SameSite=Lax`
**And** the header includes `Path=/`
**And** reading `document.cookie` in the browser does not expose `sid`

## Expected Result
The session cookie is inaccessible to page scripts and is not sent on cross-site requests.

## Notes
The `Secure` attribute is absent because the demo runs over plain HTTP; it would be required over HTTPS.
