---
id: TC-SEC-002
title: Error message does not reveal whether the username exists
area: Security
type: Security
priority: Medium
route: POST /login
automated: false
---

# TC-SEC-002 — Error message does not reveal whether the username exists

## Objective
Verify that a wrong password and an unknown username produce indistinguishable responses, preventing account enumeration.

## Preconditions
- The application is running at `http://localhost:3000`.
- The client has no `sid` session cookie.

## Test Data
| Field | Value |
| --- | --- |
| Attempt A | `admin` / `wrongpassword` (existing user) |
| Attempt B | `nobody` / `wrongpassword` (unknown user) |

## Scenario

**Given** the user is on the login page at `/`
**When** the user submits attempt A with an existing username and a wrong password
**And** the user submits attempt B with an unknown username and the same password
**Then** both responses have status `401`
**And** both display the error `Invalid username or password.`
**And** neither message states that the user does not exist or that only the password was wrong

## Expected Result
The two failures are indistinguishable to the client.

## Notes
Response timing is out of scope here; the static credential map makes timing differences negligible.
