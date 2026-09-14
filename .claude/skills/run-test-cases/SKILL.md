---
name: run-test-cases
description: Run every automated test case and record the result as a structured markdown report under tests/runs/. Use when asked to run the tests, execute the suite, produce or record a test report, check whether the suite passes, or capture evidence of a test run. Refuses to run against a dirty working tree, captures the commit hash and message, and writes per-case results with latency, completion timestamps, skip reasons and links back to each case specification.
---

# Running the test cases

One command runs every automated case and writes a dated, self-contained record of what
happened:

```bash
npm run test:report
```

Equivalent to `node .claude/skills/run-test-cases/scripts/run-tests.js`.

The report lands in `tests/runs/<ISO timestamp>.md`, and the path is printed on the last
line. **Commit the report** — it is the evidence that a given commit passed, and it is
worthless if it only ever exists on one machine.

## Why it refuses to run

A result is a claim about a specific state of the code. Two guards keep that claim honest:

| Guard | Exit | Reason |
| --- | --- | --- |
| Not a git repository | `2` | The report records the commit a result belongs to. Without git there is nothing to record, so the result cannot be traced to anything. |
| Working tree is dirty | `3` | The report would name a commit whose content is not what actually ran. |

Do not reach for `--allow-dirty` to get past the second one. Commit or stash first. The flag
exists for the case where you genuinely need a result from uncommitted work — it runs, but
the report is stamped **"This run is not reproducible"**, lists every uncommitted path, and
stays that way in the repo forever.

`tests/runs/` is excluded from the dirty check — it holds this runner's own output, and an
uncommitted report from an earlier run says nothing about what is being executed now.
Without that exclusion two runs in a row would be impossible without a commit between them.
Everything else counts.

Other exit codes: `0` everything passed · `1` something failed or did not report ·
`4` no executable cases found.

## Options

| Flag | Effect |
| --- | --- |
| `--allow-dirty` | Run with uncommitted changes; marks the report unreproducible. |
| `--dry-run` | Print what would run and exit. Does not write a report. |

## What ends up in the report

| Section | Contents |
| --- | --- |
| Verdict | One line: PASS/FAIL, executed / passed / failed / skipped |
| Run context | Run ID, start and finish timestamps, wall clock, command, runner exit code, Node version, platform, host |
| Repository state | Clean or dirty, branch, short and full commit hash, commit message, commit date, author; the list of uncommitted paths if dirty |
| Summary | Case counts, total latency (sum), wall clock, mean / median / p95 latency, fastest and slowest case, latency broken down by suite |
| Results | One row per executed case: link to the case file, title, result, latency, completion timestamp, suite, priority |
| Skipped | Every case that did not run, with the reason and its automation status |
| Failures | Per failure: the case, its script, latency, and the full assertion diagnostic |
| Manual follow-up | `semi-automated` cases whose manual steps this run did not cover |
| Untraceable tests | Tests that ran but whose names do not start with a known case ID |

Two latency numbers are reported because they answer different questions. **Total latency**
is the sum of the individual cases — the work done. **Wall clock** is elapsed real time,
which is smaller because `node --test` runs files in parallel. Use the sum when judging
whether a case is too expensive for its risk (BSI-P-14 in the `write-test-case` skill); use
wall clock when judging whether the suite is fast enough to run on every commit.

## How cases and tests are matched

The runner reads `tests/cases/*.md`, takes the `script` path from each case's front matter,
and runs those files. It then matches each TAP result back to a case by the `TC-AREA-NNN`
prefix of the test name.

This is why the `write-test-case` skill requires a test name beginning with the case ID. A
test whose name does not start with a known ID still runs, but lands in **Untraceable
tests** — it proves nothing, because nothing says what it was meant to verify.

A case is reported as **skipped**, not run, when it is `deprecated`, when `automation` is
`manual` or `planned`, or when its `script` is missing from disk. The reason appears in the
report, so a case can never quietly stop being tested.

## When the run fails

Read the report before touching anything. The Failures section has the assertion, the
expected and actual values, and the stack.

Then work out which side is wrong:

- **The application regressed** — fix the application. The case was right.
- **The requirement changed** — update the case *through the `write-test-case` skill*: bump
  `version`, add a change-log row explaining why, update the script and its inline copy, and
  update the reference's `demand` if the test basis itself moved.

Never edit a case or its script purely to make a red run go green. That converts a detected
defect into a documented lie, and the change log is where it will be visible forever.

**Not reported** in the summary means a script produced no TAP output at all — it usually
crashed at module load. Run that one file directly to see the error:
`node --test tests/scripts/TC-XXX-NNN.test.js`.

## Report file naming

```
tests/runs/2026-09-14T12-30-57Z.md
```

ISO 8601 UTC to the second, with `:` replaced by `-` so the name is safe on every
filesystem. Sorting the directory by name sorts it by time.

## Requirements

Node 20 or newer, and git. The runner uses only `node:test` and the TAP reporter, both
built in.
