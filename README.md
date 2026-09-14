# Login demo app

A minimal Express app used as a target for testing exercises. Static credentials, no database.

## Run

```bash
npm install
npm start        # http://localhost:3000  (override with PORT=4000)
```

Requires Node 20 or newer.

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

`server.js` exports the Express app, so a test can bind it to an ephemeral port instead of
occupying 3000.

## Tests

```bash
npm test                                                       # run the case scripts
npm run test:report                                            # run them and record a report
bash .claude/skills/write-test-case/scripts/validate-cases.sh  # check the case files
```

36 test cases live in `tests/cases/`, one markdown file each, with the script that executes
it in `tests/scripts/`. See [tests/cases/README.md](tests/cases/README.md) for the index and
[the `write-test-case` skill](.claude/skills/write-test-case/SKILL.md) for the format.

`npm run test:report` additionally writes a dated record of the run to `tests/runs/` —
per-case results, latency, and the commit it ran against. It refuses to run against a dirty
working tree. See [the `run-test-cases` skill](.claude/skills/run-test-cases/SKILL.md).

Scripts use the built-in `node:test` runner and `fetch` — no test dependencies.

## Layout

```
server.js          app + routes
views/login.html   login form
public/style.css   styles
tests/cases/       test cases, one markdown file each
tests/scripts/     the script for each case, plus the shared harness
tests/runs/        one report per suite execution
```
