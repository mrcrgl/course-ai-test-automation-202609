# Test runs

One file per execution of the suite, written by the `run-test-cases` skill:

```bash
npm run test:report
```

Each file is named for the run's start time — ISO 8601 UTC to the second, with `:` replaced
by `-` — so listing this directory by name lists it in chronological order.

A report records the verdict, the commit it ran against, per-case results with latency and
completion timestamps, skip reasons, and the full diagnostic for anything that failed. It
links back to each case in `../cases/`.

**Reports belong in version control.** They are the evidence that a given commit passed. The
runner refuses to run against a dirty working tree precisely so that the commit named in a
report describes exactly what was executed.

The reports in this directory are the ones somebody recorded and committed deliberately. CI
runs the same command on every pull request, but attaches its report to the run as an
artifact instead of committing it — see "Continuous integration" in the top-level
[README](../../README.md).
