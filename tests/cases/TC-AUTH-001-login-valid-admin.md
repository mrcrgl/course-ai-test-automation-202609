---
id: TC-AUTH-001
title: Successful login with valid admin credentials
area: Authentication
type: Positive
priority: Critical
route: POST /login
automated: false
---

# TC-AUTH-001 — Successful login with valid admin credentials

## Objective
Verify that valid credentials authenticate the user and lead to the success page.

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
**And** the user has entered the username `admin`
**And** the user has entered the password `admin123`
**When** the user submits the login form
**Then** the response status is `302` with header `Location: /success`
**And** a `sid` session cookie is set
**And** following the redirect returns status `200`
**And** the success page shows the heading `Login successful`
**And** the element with `data-testid="username"` contains `admin`

## Expected Result
The user is authenticated and sees the success page identifying them as `admin`.

## Notes
Happy path — the primary acceptance criterion of the application.
