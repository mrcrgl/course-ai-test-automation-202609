---
name: write-test-case
description: Write, update, review or migrate a test case in tests/cases/. Use when asked to add or change a test case, turn a ticket's acceptance criteria into cases, cover a security requirement, or check that existing cases conform to the repo's format. Cases cover the running application only — never the CI workflow, build scripts or the repository's own tooling. Produces an ISTQB / ISO-IEC-IEEE 29119-3 compliant case file with traceable references (ticket AC, or a practice derived from BSI-Standard 200-3 IT-Grundschutz), full recurrence metadata, a change log, and the runnable script that tests the case.
---

# Writing a test case

A test case in this repo is one markdown file that is simultaneously a specification, a
traceability record, and the home of the script that executes it. If any of those three is
missing, the case is not done.

## What a case is allowed to cover

**The application's behaviour, and nothing else.** A test case describes something the
running system does for a user or an API client — a response, a page, a session, a refusal.

Out of scope, no matter how testable it looks:

| Not a test case | Where it belongs instead |
| --- | --- |
| The CI workflow — triggers, matrix, permissions, artifacts | Code review of `.github/workflows/`, and the workflow's own runs |
| Build, packaging or release scripts | The same: review, plus the fact that they run |
| The repository's own tooling — the runner, this validator, the case format | Review; a change that breaks them is visible immediately |
| Editor, linter or dependency configuration | Review |

The temptation is real when a ticket's acceptance criteria are *about* the pipeline, and the
criteria are readable straight out of a YAML file. Resist it. A case asserting that a
workflow file declares `node-version: [20, 24]` proves that a file says what it says; it
tells you nothing about whether the application works, it goes red when the pipeline is
improved rather than when the product breaks, and it puts the suite in the business of
guarding its own scaffolding. Pipeline criteria are evidenced by the pipeline running — link
the run.

If a ticket about infrastructure has no acceptance criterion describing application
behaviour, it gets no test case. Say so in the pull request rather than inventing one.

## Non-negotiables

1. **The case is about the application.** See the section above.
2. **Every case traces to something.** A ticket acceptance criterion, or a BSI practice.
   Never "because it seemed sensible". A case with no `references` entry fails validation.
3. **Prefer the ticket AC.** BSI practices are the fallback for security behaviour no ticket
   describes — not a decoration to add alongside an AC that already covers the behaviour.
4. **Every case carries its script.** Inline in `## Test Script` and on disk at
   `tests/scripts/<ID>.test.js`. The two must be identical.
5. **Every case carries its change log.** Append-only, newest first, row count equals
   `version`.
6. **Verify before you write the expected result.** Run the behaviour against the actual
   application and assert what it *does*. A case full of plausible-looking expectations that
   nobody ever executed is worse than no case, because it looks like coverage.
7. **One case, one behaviour.** If the title needs an "and", it is two cases.

## Workflow

### 1. Establish the test basis
Find what the case traces to, before writing anything:
- **From a ticket** — read the acceptance criteria. One case per AC, minimum; usually more,
  since an AC states the positive path and the negative paths are implied. Reference as
  `<TICKET>/AC-<n>`.
- **For security behaviour with no ticket** — read
  `references/bsi-200-3-practices.md` and pick the practice. Its "Quick selection guide"
  maps common web-app security concerns to practice IDs. Most land on BSI-P-11
  (suitability — cover the threat in full) or BSI-P-13 (user friendliness — tolerance,
  transparency, circumvention).
- **Neither** — `type: derived`, with `source` naming the file and line the behaviour was
  read from. Use sparingly; a repo full of `derived` cases has no test basis at all.

If the ticket's criteria are all about the build or the pipeline rather than the application,
stop here — there is nothing for this skill to write.

### 2. Derive the case set
Do not stop at the happy path. For each behaviour, BSI-P-11 and BSI-P-13 generate the
checklist:

| Angle | Question |
| --- | --- |
| Positive | Does the authorised path work? |
| Negative | Is the unauthorised path refused? |
| Boundary | What about empty, whitespace, wrong case, over-long? |
| Bypass | Can the safeguard be circumvented directly — forged cookie, direct URL, replay? |
| Tolerance | Does a user error produce a helpful result rather than a crash? |
| Transparency | Can the user tell the safeguard acted, without being told which part failed? |

### 3. Classify
Set `test_level`, `test_type`, `design_technique`. For `test_type: security`, fill
`## Risk & Coverage`: core value (BSI-P-01), elementary threat `G 0.x` (BSI-P-02), frequency
and damage from the fixed vocabularies (BSI-P-06), then read `risk_category` off the matrix
in BSI-P-07 and let it set `priority`. Do not set a security priority by feel.

### 4. Verify the actual behaviour
Start the app (`npm start`) and exercise the case by hand — `curl` is enough for HTTP.
Record what really happens. Where behaviour surprises you, that is worth a `## Notes` line.

### 5. Write the file
Copy `templates/test-case.md`, fill every field. Format rules, allowed values and section
semantics are in `references/case-format.md` — consult it rather than guessing; the
validator enforces it.

### 6. Write and run the script
Create `tests/scripts/<ID>.test.js`, one assertion per `**Then**`/`**And**` step in the same
order, test name prefixed with the case ID. Use `node:test`, `node:assert/strict` and
`fetch` — all built in, no new dependencies. Run it. **A case whose script has never passed
does not ship.** Then paste the exact file contents into `## Test Script` and record the
measured runtime in `duration`.

### 7. Register and validate
Add the row to `tests/cases/README.md`. Then:

```bash
bash .claude/skills/write-test-case/scripts/validate-cases.sh   # format
npm test                                                        # scripts
```

Both must be clean.

## Updating an existing case

Never edit a case silently. Bump `version`, set `updated` and `last_reviewed`, prepend a
`## Change Log` row whose `Reason` explains *why* the change was needed, and update the
script and its inline copy together. If the requirement itself changed, update the
`references` entry's `demand` too — a stale `demand` is how a case quietly ends up
testing last quarter's requirement (BSI-P-16).

Retiring a case: set `status: deprecated`, keep the file, log the reason. Never reuse its
number. If it is being retired because the risk was accepted rather than fixed, say who
accepted it (BSI-P-09).

## Files in this skill

| Path | Contents |
| --- | --- |
| `references/case-format.md` | Normative format: naming, every front-matter key and its allowed values, every body section, the ISTQB/29119-3 attribute mapping |
| `references/bsi-200-3-practices.md` | BSI-P-01…16, condensed from BSI-Standard 200-3 with section citations, the elementary-threat table, the risk vocabularies and the priority matrix |
| `templates/test-case.md` | The skeleton to copy |
| `scripts/validate-cases.sh` | Format validator |

Worked example: `tests/cases/TC-AUTH-003-login-wrong-password.md` with
`tests/scripts/TC-AUTH-003.test.js`.
