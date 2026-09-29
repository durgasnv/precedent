# Next implementation priorities

Reviewed against `main` on 2026-09-29. PRECEDENT already records decisions, retains them in Hindsight, recalls supporting facts, reassesses changed assumptions, and keeps a collection timeline. The [flexible memory roadmap](flexible-memory-roadmap.md) originally marked document import and outcome feedback as planned; this review ranks them alongside gaps found in the current API and frontend.

| Order | Implementation | Why it matters |
| --- | --- | --- |
| 1 | Authenticate users and authorize collections | Collection IDs currently organize data but do not restrict who can read or change it. Required before a shared deployment. |
| 2 | Make canonical storage and Hindsight retention recoverable | The JSON store supports one process, and a failure between Hindsight retain and the file write can leave the two systems inconsistent. |
| 3 | Import reviewed source documents with provenance | Manual entry makes it hard to adopt PRECEDENT for an existing decision history or check a claim against its original passage. |
| 4 | Record measured follow-up outcomes | Reassessment now records a generated assessment; the actual result of a later experiment has no dedicated linked workflow. |
| 5 | Show real connection status and measure memory quality | “Live mode” currently means an API URL exists, while the smoke script covers only a small fixed set of cases. |

Priorities 1–3 were implemented on 2026-09-29. See [access control](access-control.md), [storage and retention](storage-and-retention.md), and [reviewed import](import-review.md). The baseline descriptions below explain the gaps that prompted those changes; priorities 4 and 5 remain planned.

## 1. Authenticate users and authorize collections

**Current behavior:** `src/app.js` enables unrestricted CORS. `src/routes/index.js` accepts any existing collection named in `X-Precedent-Collection`; `src/routes/collections.js` lists and creates collections without a caller identity. `src/services/aiMemoryService.js` already gives non-demo collections separate Hindsight banks, but bank separation cannot authorize an HTTP caller.

**Implementation path:** Add authentication middleware before collection routes, store collection ownership or membership, and check access for every list, read, write, analysis, reassessment, and timeline request. Derive the Hindsight bank from the authorized collection on the server. Restrict browser origins for a hosted deployment. Keep a clearly scoped local-only mode if the single-user workflow remains useful. Hindsight's [bank strategy guide](https://hindsight.vectorize.io/blog/2026/07/16/bank-strategy-agent-memory) describes separate banks as a hard isolation boundary; application access checks are still needed before choosing one.

**Done when:** A caller cannot enumerate another team's collections or access one by guessing its UUID or sending its header. Authorization checks cover every API route and the Hindsight bank selected for that route.

## 2. Make storage and Hindsight retention recoverable

**Current behavior:** `src/models/decision.js` writes atomic JSON snapshots for one backend process. `src/services/orchestrator.js` calls Hindsight retain before inserting the canonical record. A failed file write after a successful retain can leave a memory with no saved decision; concurrent processes cannot safely share the file.

**Implementation path:** Move canonical records and timeline events to a transactional database. Save a decision and an outbox job in one transaction; a worker retains the decision under the existing stable `decision:<id>` document ID, records success or a retryable failure, and reconciles stuck jobs. Show indexing status in the UI, and exclude pending decisions from precedent analysis until retention is confirmed. Add a repair command that compares canonical IDs with retained document IDs. Hindsight's [document API](https://hindsight.vectorize.io/developer/api/documents) supports tracing and updating retained source documents.

**Done when:** A crash or provider outage at any point in recording can be retried without losing the canonical record, duplicating the decision, or presenting an unindexed decision as recalled evidence. Two API processes can serve the same database safely.

## 3. Import reviewed source documents with provenance

**Current behavior:** `frontend/src/components/DecisionForm.jsx` requires manual fields; `evidence` is a list of user-entered strings. The source passage behind a decision is not preserved as an inspectable artifact. This is stage 5 in the existing roadmap.

**Implementation path:** Start with pasted text and Markdown files. Extract a *draft* decision with field-level source passages, document title, source URL or filename, import time, and content hash. Show the draft and passages together for human review. Save and retain only after the user confirms it; retain the approved decision with a stable source reference and keep the original text retrievable. Add GitHub or incident-system connectors after this review flow works. Hindsight [documents and chunks](https://hindsight.vectorize.io/developer/api/documents) can preserve the relationship between recalled facts and source text.

**Done when:** An engineer can import an existing decision note, correct any extracted field, and open the exact source passage behind a later recalled match. Missing facts stay unknown instead of being filled in by generation.

## 4. Record measured follow-up outcomes

**Current behavior:** `src/services/orchestrator.js` saves a reassessment event after Reflect returns, and `src/models/decision.js` stores the generated status and evidence gaps. The app has no dedicated way to record the observed result of a follow-up test. This is stage 7 in the existing roadmap.

**Implementation path:** Add a follow-up event tied to the original decision with the experiment, measurements, observation date, source evidence, reviewer, and final human conclusion. Keep the original record immutable. Retain the confirmed outcome as a separate Hindsight document linked to the original decision ID, then show both in the timeline and on subsequent matches.

**Done when:** A new proposal can recall both “WebSockets failed behind restrictive proxies” and a later measured WebSocket test under changed network conditions, with each outcome attributed to its own date and evidence.

## 5. Show real connection status and measure memory quality

**Current behavior:** `frontend/src/api.js` sets `liveMode` from the presence of `VITE_API_BASE_URL`, and the sidebar labels that state “Backend analysis enabled.” `GET /api/health` reports that Express is alive; it does not verify Hindsight readiness. `scripts/memory-smoke.js` checks three related examples and one unrelated proposal, but does not provide a broader quality or latency report.

**Implementation path:** Keep the current health route for process liveness. Add a separate readiness check with a timeout that reports API configuration, canonical-store access, and the selected collection's Hindsight availability without exposing credentials. Show checking, connected, and unavailable states in the sidebar. Build a versioned evaluation set of positive, negative, conflicting, and changed-assumption proposals. Track correct decision recall, false matches, valid source IDs, no-match behavior, and response time across Hindsight or prompt changes. Use Recall for candidate evidence and Reflect for the relevance or reassessment work that requires synthesis; Hindsight's [Recall and Reflect guide](https://hindsight.vectorize.io/blog/2026/07/24/recall-vs-reflect) explains the distinction.

**Done when:** “Connected” requires a successful readiness result, provider errors are visible without revealing secrets, and a repeatable evaluation report makes a regression in relevant matches or citations clear before release.

## Suggested delivery sequence

First restore a working baseline on `main` and keep the seed and smoke scripts available. For a local single-user pilot, connection status and reviewed import provide the quickest visible improvement. For any shared deployment, complete collection authorization and recoverable storage before inviting real team data. Outcome feedback follows once imported decisions and canonical records have stable provenance. Run the memory evaluation set as each change lands.
