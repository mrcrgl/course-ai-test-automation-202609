# BSI IT-Grundschutz practices for test cases

Condensed from **BSI-Standard 200-3, "Risk Analysis based on IT-Grundschutz", Version 1.0,
October 2017** (Federal Office for Information Security, Bonn). 45 pages.
Source PDF: <https://www.bsi.bund.de/SharedDocs/Downloads/EN/BSI/Grundschutz/International/bsi-standard-2003_en_pdf.pdf>

200-3 is a **risk analysis** standard, not a testing standard. It says nothing about test
cases directly. What follows is a derivation: each practice restates a rule the standard
imposes on a security concept, and then states what that rule means for a test case that
verifies a safeguard belonging to that concept. Cite a practice by its `BSI-P-nn` ID in a
case's `references` block, together with the section of 200-3 it derives from.

Use these only when there is no ticket acceptance criterion to point at. An AC always wins
as a reference; a BSI practice is the fallback for security behaviour nobody wrote a ticket
for.

---

## Scope and core values

### BSI-P-01 — Name the core value under test
**Derived from:** §3 (Summary of the elementary threats)
**Standard says:** Every elementary threat is mapped to the core values of information
security it *directly* impairs — confidentiality (C), integrity (I), availability (A).
The standard is explicit that indirect effects are not counted.
**For a test case:** A security case declares which of C / I / A it protects, and only the
one(s) directly at stake. A case that claims all three usually has not been thought through.

### BSI-P-02 — Anchor the case to an elementary threat
**Derived from:** §3, §4.1 (Determination of elementary threats)
**Standard says:** The BSI abstracted the individual threats of the IT-Grundschutz
Compendium into 47 product- and technology-neutral elementary threats (G 0.1 – G 0.47),
optimised for risk analysis.
**For a test case:** State the `G 0.x` the case defends against. It forces the question
"what real-world event is this test actually about?" Threats most relevant to a web
application with a login:

| Threat | Core value |
| --- | --- |
| G 0.14 Espionage | C |
| G 0.19 Disclosure of information that should be protected | C |
| G 0.20 Information from unreliable sources | C, I, A |
| G 0.21 Manipulation of hardware or software | C, I, A |
| G 0.22 Manipulation of information | I |
| G 0.23 Unauthorised entry into IT systems | C, I |
| G 0.28 Software vulnerabilities or errors | C, I, A |
| G 0.30 Unauthorised use or administration of devices and systems | C, I, A |
| G 0.31 Incorrect use or administration of devices and systems | C, I, A |
| G 0.32 Misuse of authorisations | C, I, A |
| G 0.36 Identity theft | C, I, A |
| G 0.37 Repudiation of acts | C, I |
| G 0.38 Misuse of personal data | C |
| G 0.40 Denial of services | A |
| G 0.43 Importing messages | C, I |
| G 0.45 Loss of data | A |
| G 0.46 Loss of integrity of information that should be protected | I |

The full list of 47 is in §3 of the standard.

### BSI-P-03 — Filter for direct relevance, and record the exclusion
**Derived from:** §4.1
**Standard says:** For each target object, decide whether a threat applies at all. The
standard works through examples where a threat is dismissed as "indirect impact / not
relevant" — e.g. G 0.1 Fire is irrelevant to a specific operating system, because
considering it would add nothing beyond G 0.25 Failure of devices or systems.
**For a test case:** Do not write cases for threats that do not directly apply to the
component under test, and do not write a second case that would assert nothing the first
one does not already assert. When you decide a plausible threat is out of scope, say so in
`## Notes` rather than leaving it silently uncovered.

### BSI-P-04 — Look beyond the catalogue
**Derived from:** §4.2 (Determination of additional threats), §9.3
**Standard says:** The 47 elementary threats are a floor, not a ceiling. Target-specific
threats must be determined additionally, e.g. by brainstorming with qualified staff.
**For a test case:** After covering the catalogue threats, ask what is specific to *this*
application. Those cases get `type: bsi-practice` with `BSI-P-04` and a plain-language
description of the threat in the objective.

---

## Risk assessment drives priority

### BSI-P-05 — Priority follows frequency × damage
**Derived from:** §5.1 (Risk assessment)
**Standard says:** Risk depends on both the **frequency of occurrence** of the threat and
the **extent of the imminent damage**. Both must be taken into account.
**For a test case:** `priority` is not a gut feeling. Derive it from the two BSI dimensions
recorded in the `## Risk & Coverage` block, via the risk matrix in BSI-P-07.

### BSI-P-06 — Qualitative categories, reproducible between people
**Derived from:** §5.1, Tables 8 and 9
**Standard says:** Quantitative risk assessment needs statistical data that information
security rarely has; work qualitatively, with no more than five categories per dimension.
Crucially: *"If a specific risk is assessed by two different employees of an organisation,
the same result should be obtained."*
**For a test case:** Use exactly these vocabularies, no free text:

| Frequency of occurrence | Definition (§5.1, Table 8) |
| --- | --- |
| `rarely` | According to present knowledge, could occur every 5 years at most |
| `medium` | Once every 5 years to once a year |
| `frequently` | Once a year to once a month |
| `very-frequently` | Several times a month |

| Extent of damage | Definition (§5.1, Table 9) |
| --- | --- |
| `negligible` | Effects are low and can be neglected |
| `limited` | Effects are limited and manageable |
| `considerable` | Effects can be considerable |
| `existence-threatening` | Effects can reach a catastrophic level that threatens the existence of the organisation |

For an internet-facing application, read "frequency" as how often an attacker attempts the
thing, not how often it succeeds.

### BSI-P-07 — Map risk category to test priority
**Derived from:** §5.2 (Risk evaluation), Table 10
**Standard says:** Risk categories are `Low`, `Medium`, `High`, `Very high`, defined by how
adequately the safeguards already in the security concept protect against the threat. The
standard supplies a matrix (Figure 3) but states it "should be adapted to the individual
needs" of the organisation.

**Project-local adaptation** — this matrix is *ours*, not a quotation from the standard:

| Damage ↓ / Frequency → | rarely | medium | frequently | very-frequently |
| --- | --- | --- | --- | --- |
| `existence-threatening` | high | high | very-high | very-high |
| `considerable` | medium | high | high | very-high |
| `limited` | low | medium | medium | high |
| `negligible` | low | low | low | medium |

**For a test case:** `risk_category` → `priority`: `very-high` → `critical`,
`high` → `high`, `medium` → `medium`, `low` → `low`. If you override, justify it in
`## Notes`.

---

## Treatment determines whether a case exists at all

### BSI-P-08 — Record which treatment option the case verifies
**Derived from:** §6.1 (Risk treatment options)
**Standard says:** Four options — **A avoidance** (exclude the cause, e.g. restructure the
process), **B reduction/modification** (supplemental safeguards), **C transfer/sharing**
(insurance, outsourcing), **D acceptance**. Management must be involved in the decision.
**For a test case:** State the option in `## Risk & Coverage`. It tells a reader what the
test is evidence *of*:
- **A** — assert the dangerous capability is absent (the feature genuinely is not there).
- **B** — assert the supplemental safeguard works. Most security cases are B.
- **C** — assert the boundary to the third party behaves as contracted; the risk itself is
  someone else's to carry.
- **D** — normally produces **no** test case. See BSI-P-09.

### BSI-P-09 — An accepted risk is documented, not silently untested
**Derived from:** §6.1 D (Risk acceptance)
**Standard says:** Residual risk is submitted to management for approval, documenting in a
traceable manner that the organisation is aware of it. Reasons to accept a higher risk
include: damage only arises in very special circumstances; no effective countermeasure is
known; the cost of countermeasures exceeds the value of the asset.
**For a test case:** Do not fake coverage of an accepted risk. Either omit the case, or
write it with `status: deprecated` and a `## Notes` entry naming the accepted residual risk
and who accepted it. An untested accepted risk is fine; an *undocumented* one is not.

### BSI-P-10 — Risks under monitoring get scheduled runs
**Derived from:** §6.2 (Risks subject to monitoring)
**Standard says:** Some risks are acceptable now but expected to grow. Supplemental
safeguards are developed and earmarked in advance, and the risks are monitored via a risk
register. All risks should be monitored, not only the growing ones.
**For a test case:** A case covering a currently-low but growing risk still belongs in the
suite — give it `frequency: nightly` or `frequency: release` rather than dropping it.
`frequency` is the monitoring interval.

---

## Consolidation criteria — the strongest source of test ideas

§7 (Consolidation of the security concept) lists four checks to apply to every safeguard.
Each converts directly into a class of test case, and BSI-P-11 through BSI-P-14 are the
practices to cite for most security tests in this repo.

### BSI-P-11 — Suitability: cover the threat in full
**Standard asks:** *"Have all the aspects of the relevant threats been covered in full? Do
the counteractions match the security objectives?"*
**For a test case:** One positive case is not coverage. For an access control, that means
the authorised path, the unauthorised path, the boundary, *and* the bypass attempt. If a
case covers only one aspect, its `## Notes` names the sibling cases covering the rest.

### BSI-P-12 — Interaction: test safeguards together
**Standard asks:** *"Do the safeguards support each other? Is an effective entity produced
by the interaction? Do the safeguards conflict with each other?"*
**For a test case:** Cite this for integration-level cases that exercise two safeguards at
once — e.g. session invalidation *and* cookie clearing, or input validation *and* output
escaping. A safeguard that passes alone and fails in combination is exactly what this looks
for.

### BSI-P-13 — User friendliness: safeguards must survive real users
**Standard asks:** *"Are the safeguards tolerant towards user and operating errors? Are they
transparent to the employees concerned? Is it clear to users if a safeguard is omitted? Is
it too easy for users to circumvent the safeguard?"* And: *"Security safeguards that are not
accepted by the parties concerned have no effect."*
**For a test case:** This licenses usability and robustness cases as *security* cases —
error messages that tell the user what to fix, input that is tolerantly normalised, state
preserved across a failed attempt, and above all the circumvention attempt. Four distinct
case ideas per safeguard.

### BSI-P-14 — Appropriateness: proportional effort
**Standard asks:** *"Are the safeguards appropriate for the corresponding threats? Are the
costs and effort required for implementation appropriate in scale for the protection
requirement?"* Safeguards that are too costly should be reworked or rejected; *"safeguards
that are too weak endanger information security"* and should be too.
**For a test case:** Applies to the test as much as the safeguard. A `low` risk does not
justify a slow, brittle, high-maintenance case. If `duration` and `priority` are badly out
of proportion, rework the case.

---

## Documentation and review

### BSI-P-15 — Traceability through documentation
**Derived from:** §8 (Feedback to the security process)
**Standard says:** *"In order to achieve traceability, the security process must be
documented on all levels."* Management is to be informed of the security status at regular
intervals.
**For a test case:** This is why `## Change Log` is mandatory and why every case needs at
least one entry in `references`. A case whose origin cannot be traced is not evidence of
anything.

### BSI-P-16 — Re-check after every change
**Derived from:** §8
**Standard says:** Because the risk analysis generally changes the security concept, the
implementation status of altered requirements must be re-checked and outdated results
updated. Threats behind user-defined modules must be re-evaluated at regular intervals.
**For a test case:** `last_reviewed` and `review_interval` exist for this. A case whose
review date has lapsed is stale regardless of whether it is green — a passing assertion
about last year's requirement proves nothing about today's.

---

## Quick selection guide

| You are writing a case about… | Cite |
| --- | --- |
| A ticket's acceptance criterion | the AC — not a BSI practice |
| Authentication rejecting bad credentials | BSI-P-11 (+ G 0.23, G 0.36) |
| Access control on a protected page | BSI-P-11 (+ G 0.30, G 0.32) |
| Session invalidation, cookie attributes | BSI-P-12 (+ G 0.23) |
| Output escaping / injection | BSI-P-11 (+ G 0.21, G 0.43) |
| Error messages, input tolerance, state after failure | BSI-P-13 (+ G 0.31) |
| Not leaking which credential was wrong | BSI-P-11 (+ G 0.19) |
| A bypass or circumvention attempt | BSI-P-13 (+ G 0.30) |
| Something the catalogue does not cover | BSI-P-04 |
