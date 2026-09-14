---
id: TC-AREA-000
title: Imperative statement of the behaviour under test
version: 1
status: draft
owner: you@example.com
created: YYYY-MM-DD
updated: YYYY-MM-DD
test_level: system
test_type: functional
design_technique: equivalence-partitioning
priority: medium
suite: regression
frequency: per-commit
automation: automated
script: tests/scripts/TC-AREA-000.test.js
duration: 0s
environment: local-dev
last_reviewed: YYYY-MM-DD
review_interval: 6m
stability: stable
references:
  - id: TICKET-000/AC-0
    type: acceptance-criterion
    source: https://tracker.example.com/browse/TICKET-000
    demand: One sentence quoting or paraphrasing what the source requires.
---

# TC-AREA-000 — Imperative statement of the behaviour under test

## Objective
What this case proves, in terms of observable behaviour. One or two sentences.

## References
| Reference | Type | Source | What it demands |
| --- | --- | --- | --- |
| `TICKET-000/AC-0` | Acceptance criterion | TICKET-000 | One sentence. |

## Preconditions
- The application is running at `http://localhost:3000`.
- Concrete, checkable starting state.

## Test Data
| Field | Value |
| --- | --- |
| Username | `admin` |

## Scenario

**Given** the starting state
**And** further starting state
**When** the action under test occurs
**Then** the first observable outcome holds
**And** the second observable outcome holds

## Expected Result
Prose summary of the outcome, readable by someone who skipped the steps.

## Postconditions
- State after execution, including any cleanup. `None — the case makes no state change.`

## Risk & Coverage
Not applicable — functional case, no threat model entry.

<!-- For test_type: security, replace the line above with:
| Field | Value |
| --- | --- |
| Core value (BSI-P-01) | Confidentiality |
| Elementary threat (BSI-P-02) | G 0.23 Unauthorised entry into IT systems |
| Frequency of occurrence (BSI-P-06) | `frequently` |
| Extent of damage (BSI-P-06) | `considerable` |
| Risk category (BSI-P-07) | `high` |
| Treatment option (BSI-P-08) | B — Risk reduction |
| Residual risk | What remains uncovered, and who accepted it. |
-->

## Test Script
Implemented in `tests/scripts/TC-AREA-000.test.js` — run with `npm test`.

```javascript
// Exact copy of the file on disk. One assertion per Then/And step, in order.
```

## Change Log
| Version | Date | Author | Change | Reason |
| --- | --- | --- | --- | --- |
| 1 | YYYY-MM-DD | you@example.com | Created | Why this case was needed. |

## Notes
None.
