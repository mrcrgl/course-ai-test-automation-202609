# Login demo app

A minimal Express app used as a target for testing exercises. Static credentials, no database.

## Run

```bash
npm install
npm start        # http://localhost:3000  (override with PORT=4000)
```

## Credentials

| Username | Password   |
| -------- | ---------- |
| `admin`  | `admin123` |
| `tester` | `test123`  |

## Routes

| Method | Path         | Behaviour                                                          |
| ------ | ------------ | ------------------------------------------------------------------ |
| GET    | `/`          | Login form. Redirects to `/success` if already logged in.           |
| POST   | `/login`     | Valid → 302 to `/success` + session cookie. Invalid → 401 with the form and an error. Missing field → 400. |
| GET    | `/success`   | Success page. Redirects to `/` when not logged in.                  |
| POST   | `/logout`    | Clears the session, redirects to `/`.                               |
| POST   | `/api/login` | JSON variant: `{ok: true, username}` / 401 / 400.                   |

## Test hooks

Elements carry `data-testid` attributes: `login-form`, `username-input`, `password-input`,
`login-button`, `error-message`, `success-heading`, `username`, `logout-button`.

`server.js` exports the Express app, so it can be driven directly by Supertest without
binding a port.

## Layout

```
server.js          app + routes
views/login.html   login form
public/style.css   styles
```
