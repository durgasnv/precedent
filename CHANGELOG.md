# PRECEDENT Change Log

This document records each project change, the affected workflow, and the process used. The repository currently contains planning documents; the application has not been implemented yet.

## 2026-09-27 — Establish the PRECEDENT application name

### Change

- Replaced the former names DecisionTrace and RecallGuard with PRECEDENT throughout the project documents.
- Removed the provisional-name note from the problem statement and updated the README title.
- Added links from the README to the project documents and this change log.

### Planned feature workflow

The documented MVP lets a team record a technical decision with its goal, attempted approach, outcome, reasoning, alternatives, assumptions, and conditions for reconsideration. Hindsight retains that context. When an engineer proposes a similar approach, PRECEDENT recalls related decisions and shows the historical evidence. The engineer can provide changed circumstances, and PRECEDENT compares them with the original assumptions. The engineering team makes the final decision.

### Process

Read all project documents, searched for application-name references, updated the inconsistent names, and checked the documents again for the former names. This entry describes a documentation change; it does not claim that the planned workflow is implemented.

## 2026-09-27 — Implement the Person 1 memory and AI module

### Change

- Added the official Hindsight JavaScript client dependency, environment example, and server-side memory module.
- Added bank setup, synchronous decision retention with stable document IDs, related-memory recall, structured proposal analysis, and structured assumption reassessment.
- Added automated tests and an optional live smoke script.
- Documented configuration, module contracts, the planned backend integration, and current verification limits in [Memory and AI module](docs/memory-ai.md).

### How the feature works

A backend caller passes a decision record to `retainDecision`. Hindsight extracts searchable facts while the decision ID stays attached as metadata. A later proposal calls `recallRelated`, which returns source facts. `analyzeProposal` uses those facts and Hindsight Reflect to produce a structured explanation with checked memory references. `reassessDecision` compares new circumstances against the original record and reports a status without changing history.

### Process

Checked the current official Hindsight client and retain, recall, and reflect documentation. Implemented a standalone module so the backend team can call it from future routes. Verified behavior with mocked client tests; the live smoke path requires a configured Hindsight service and credentials.

## 2026-09-27 — Identify relevant precedents and group their evidence

### Change

- Added an explicit relevance result to proposal analysis, so unrelated recalled facts produce a no-match response.
- Grouped supported fact matches by `decision_id` for backend and UI display while keeping each source fact visible.

### How the feature works

Hindsight Recall still supplies ranked candidate facts. Reflect judges whether those facts actually address the proposal. PRECEDENT accepts match references only when they name a recalled fact, groups accepted facts from the same decision, and returns `analysis: null` with a reason when no relevant precedent is supported.

### Process

Used Hindsight's documented relative recall ranking and structured Reflect response. Added tests for an unrelated recall result, grouped facts from one decision, and invalid fact references.
