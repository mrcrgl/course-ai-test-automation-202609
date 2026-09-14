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
| GET    | `/cases`     | Index of `tests/cases/`. Login required.                            |
| GET    | `/cases/:id` | One case in full, e.g. `/cases/TC-AUTH-003`. Login required.        |
| GET    | `/runs`      | Index of `tests/runs/`, newest first. Login required.               |
| GET    | `/runs/:id`  | One run report, e.g. `/runs/2026-09-14T12-37-03Z`. Login required.  |

## Browsing the tests

The four routes above read `tests/cases/` and `tests/runs/` from disk on every request and
render them — no database, no cache, no build step. They sit behind the same session guard
as `/success`: without a `sid` cookie each one redirects to `/`.

| Page | Shows |
| --- | --- |
| `/cases` | Every case file with its ID, title, test type, priority, suite and automation status |
| `/cases/:id` | The metadata, the references and every body section of the case, plus its results in recent runs |
| `/runs` | Every recorded run with its verdict, counts, commit and duration |
| `/runs/:id` | The full report, with each case ID linking to its specification |

Unknown or malformed identifiers return 404. File content is escaped before it is
displayed — the case files deliberately contain XSS payloads as test data, so the markdown
renderer in `lib/markdown.js` escapes first and has no raw-HTML path.

Set `TESTS_DIR` to read the pages from somewhere other than `tests/`; the test cases use it
to render fixtures without touching the repository's own files.

## Test hooks

Elements carry `data-testid` attributes: `login-form`, `username-input`, `password-input`,
`login-button`, `error-message`, `success-heading`, `username`, `logout-button`.

The browse pages carry their own: `cases-link`, `runs-link`, `case-table`, `case-row`,
`case-count`, `case-meta`, `case-references`, `case-results`, `case-unreadable`,
`run-table`, `run-row`, `run-count`, `run-report`, `empty-runs`, `scenario`, `not-found`.

`server.js` exports the Express app, so a test can bind it to an ephemeral port instead of
occupying 3000.

## Tests

```bash
npm test                                                       # run the case scripts
npm run test:report                                            # run them and record a report
bash .claude/skills/write-test-case/scripts/validate-cases.sh  # check the case files
```

51 test cases live in `tests/cases/`, one markdown file each, with the script that executes
it in `tests/scripts/`. See [tests/cases/README.md](tests/cases/README.md) for the index and
[the `write-test-case` skill](.claude/skills/write-test-case/SKILL.md) for the format.

`npm run test:report` additionally writes a dated record of the run to `tests/runs/` —
per-case results, latency, and the commit it ran against. It refuses to run against a dirty
working tree. See [the `run-test-cases` skill](.claude/skills/run-test-cases/SKILL.md).

Scripts use the built-in `node:test` runner and `fetch` — no test dependencies.

## Layout

```
server.js          app + routes
lib/content.js     reads the case and run files off disk
lib/markdown.js    escape-first markdown renderer
lib/pages.js       the browse pages
lib/html.js        HTML escaping
views/login.html   login form
public/style.css   styles
tests/cases/       test cases, one markdown file each
tests/scripts/     the script for each case, plus the shared harness
tests/runs/        one report per suite execution
```
