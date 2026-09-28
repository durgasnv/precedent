# Flexible decision memory

PRECEDENT must work with user-supplied technical decisions, not depend on the three engineering examples. This plan extends the current retain, recall, analysis, and reassessment workflow while keeping source evidence and human decisions visible.

## Delivery order

| Stage | Feature | Acceptance criteria | Status |
| --- | --- | --- | --- |
| 1 | Persistent records and stable IDs | Records survive restart; new IDs never reuse old Hindsight document IDs; malformed storage is reported instead of silently erased. | Implemented; covered by store/API tests |
| 2 | Separate decision collections | Users can create an empty collection, switch collections, and record arbitrary examples; API records and Hindsight recall/reflection are scoped to the selected collection. | Implemented; bank/API tests and frontend build pass; live browser check pending |
| 3 | Flexible context | Optional project, team, technologies, constraints, and measurements are retained with the decision and displayed in the UI. | Implemented; validation/format test and frontend build pass |
| 4 | Real decision history | Recording and reassessment create dated events; the live timeline shows those events for the selected collection and preserves the original record. | Implemented; API, restart, and frontend checks pass |
| 5 | Reviewed document import | Paste notes or upload Markdown/text; extract a draft with supporting passages; user reviews and saves it explicitly. Unstated facts remain unknown. | Planned |
| 6 | Assumption change alerts | Submit a changed circumstance; recall potentially affected decisions in the selected collection; show cited assumptions and evidence gaps for each. | Planned |
| 7 | Outcome feedback | Record a follow-up experiment, measurements, and actual outcome linked to the original decision; retain the new event without replacing the original history. | Planned |
| 8 | Conflicting precedent comparison | Compare relevant decisions that reached different outcomes, identifying contextual differences and unresolved uncertainty with citations. | Planned |
| 9 | Experiment planning | Turn evidence gaps into a proposed test, measurements, success criteria, and rollback conditions; thresholds are suggestions requiring human approval. | Planned |
| 10 | Engineering playbooks | Produce scoped summaries across decisions with source references and freshness information; evaluate Hindsight mental models when implementing. | Planned |

## First implementation increment

Implement stages 1–4 to make examples reusable and isolated. The default `demo` collection contains the existing fixtures. New collections start empty and require no hard-coded topic or technology. Demo examples remain available without a configured backend; live collections use the API and Hindsight.

### Storage

Use an atomic JSON file for the current single-process backend, configurable through `DECISION_STORE_PATH`. Write a complete new snapshot to a temporary file and rename it into place. Keep data files outside version control. Generate UUIDs for new decisions and collections. Do not expose a newly submitted record until Hindsight retention succeeds and the local write completes.

This is a local deployment foundation, not a multi-process database. Use a persistent disk; multiple server processes must not share the same file. Hindsight and local storage are separate systems, so a disk failure after successful retention requires recovery rather than a claim of cross-system atomicity.

### Collection isolation

The browser sends the selected collection ID in `X-Precedent-Collection`. The API validates it before reading records or calling memory services. Keep the existing `HINDSIGHT_BANK_ID` for the demo collection so current seeded memories remain accessible. Give every other collection its own bank derived from its UUID and the base bank name. Apply that bank to setup, retain, recall, analysis, and reassessment. Collections organize examples; they are not authentication or permission boundaries.

### Optional context

Keep the current required decision fields. Add optional `project`, `team`, `technologies`, `constraints`, and `measurements`. Structured list fields contain strings; the UI accepts one item per line. Include these fields in retained text so recall and reasoning can use them without domain-specific conditions.

### History

Append recorded-decision and reassessment events with timestamps and decision IDs. Store reassessment output as generated interpretation, separate from the original facts. Do not automatically turn generated conclusions into retained historical facts. Future outcome feedback will retain human-confirmed observations as separate documents.

## Verification

- Restart the store and confirm saved records, collections, context, and history survive.
- Use the same proposal in two collections and verify requests reach different Hindsight banks.
- Reject access to a decision from another collection, including reassessment requests.
- Confirm a failed retain does not create a visible record or history event.
- Switch collections while a request is pending and verify old results cannot appear in the new collection.
- Check no-history behavior without injecting example records into an empty collection.
- Run API/memory tests and frontend lint/build. Report live Cloud verification separately from mocked tests.

## Later demonstration

Create an empty collection, record any technical experiment, analyze a related proposal, submit changed circumstances, then record the actual follow-up outcome. Show how subsequent answers change and cite both events. Use a second collection with a different example to demonstrate that the workflow is generic and its evidence stays scoped.
