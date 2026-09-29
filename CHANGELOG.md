# PRECEDENT Change Log

This document records each project change, the affected workflow, and the process used. The repository contains a Hindsight memory module, Express API, and React frontend.

## 2026-09-28 — Write the Hindsight technical article

Added `article.md` and linked it from the README. The article follows the stored WebSocket proxy decision through Hindsight retention, source-backed recall, structured relevance checks, and changed-assumption reassessment. It uses four small snippets from the current code and links to the requested Hindsight and Vectorize resources. Reviewed the memory module, the WebSocket fixture, and the documented live smoke result, then checked the requested length, links, and wording constraints. It makes no benchmark claim.

## 2026-09-28 — Draft technical article titles

Added `article-title-ideas.md` with 20 short Hindsight article titles grounded in the repository's decision records, memory boundaries, and assumption reassessment flow. Read the current code and chose the failed WebSocket migration as the article's central case because it connects a stored outcome to a later change in network constraints.

## 2026-09-28 — Record a live decision timeline

Stored `recorded` events when a decision is saved and `reassessed` events when an assumption check finishes, with timestamps and collection IDs. Version 2 storage migrates existing records into history. `GET /api/timeline` returns events for the selected collection; the frontend uses it in live mode and keeps its prepared timeline only for the offline demo. The reassessment event stores the generated result separately from the historical decision and is not retained as a new fact. Verified event persistence after restart, collection isolation, API responses, frontend lint, and production build.

## 2026-09-28 — Retain optional decision context

Added project, team, technologies, constraints, and measurements to the shared record contract. The form exposes them under Additional context; the API stores them, Hindsight receives them in retained text, and the decision card shows supplied values. Empty fields remain optional. Search uses supplied technologies. This lets different engineering examples keep the context that explains differing outcomes. Verified the formatted retained text, API tests, frontend lint, and build.

## 2026-09-28 — Create and switch collections from the frontend

Added a live collection selector and empty-collection creation form. All decision, detail, analysis, and reassessment requests send the selected collection ID. Each collection has its own React workspace instance, so switching clears old proposals, results, and drafts and prevents a late result from populating another collection. The offline demo remains a labeled example collection. Verified frontend lint and production build; browser and live Cloud checks remain separate from those static checks.

## 2026-09-28 — Isolate decision collections and Hindsight banks

Added collection list/create routes and collection-scoped decision reads, writes, analysis, and reassessment. `X-Precedent-Collection` defaults to the existing demo collection and is checked before memory calls. Custom collections use separate Hindsight banks; the demo keeps the existing bank. Version 1 saved records migrate into the demo collection without ID changes. Tests cover empty collections, cross-collection detail/reassessment rejection, persistence, migration, and the bank used for every memory operation. Collections organize examples and do not provide user authentication.

## 2026-09-28 — Persist decision records and use stable UUIDs

Replaced the process-only list with atomic JSON snapshots at `DECISION_STORE_PATH` (default `data/decisions.json`, ignored by Git). New decisions use UUIDs and become visible after successful Hindsight retention and a local save. Reads return copies, and malformed stored data stops startup instead of being erased. The backend uses one process and a persistent disk; Hindsight retention and file writes are not a distributed transaction. Added restart, identity, uncommitted-draft, and corrupt-file checks, and isolated API tests in temporary storage.

## 2026-09-28 — Plan flexible examples and evolving decision memory

Added `docs/flexible-memory-roadmap.md` with the proposed features, delivery order, acceptance criteria, and implementation process. The first increment covers persistent records, isolated collections, optional context, and a real timeline. Import, cross-decision alerts, outcome feedback, comparison, experiment plans, and playbooks remain explicitly planned. Reviewed the current record model, memory adapter, frontend, and existing requirements before choosing this order.

## 2026-09-28 — Share demo decisions across memory, API, and frontend

### Change

- Replaced the backend's independent one-record seed with the three Person 1 fixture decisions.
- Moved fixture dates into the shared source so Hindsight retention, the API, and frontend display use the same dates and IDs.
- Updated API tests to check the shared records and the expanded initial list.

### How the feature works

The backend initializes its in-memory decision list from `fixtures/demo-decisions.js`. The Hindsight seed script retains those same IDs as `decision:<id>` documents, and the frontend uses the same records for demo presentation. Once `npm run memory:seed` has run against the configured bank, a recalled `decision_id` can be resolved by the live decision-detail route. Newly created decisions still receive backend-generated IDs.

### Process

Compared Person 2's seed ID with the Hindsight and frontend fixture IDs, made the shared fixture authoritative, updated the dependent tests, and checked the API and frontend builds.

## 2026-09-28 — Align the frontend with the merged Express API

### Change

- Unwrapped Person 2's `{ success, data }` API responses and displayed its nested error messages.
- Sent the reassessment fields in the backend's camel-case request format.
- Removed client-generated decision IDs because the backend assigns them, and added a frontend environment example pointing to port 5000.

### How the feature works

`frontend/src/api.js` is the only browser-side route adapter. It returns the `data` body to pages and converts API error envelopes into readable messages. The browser sends only decision text and IDs; Hindsight credentials remain in the backend environment. In live mode, the decision form waits for the backend-assigned record before showing it.

### Process

Compared every frontend request and response assumption with the newly merged routes, updated the adapter and form, then checked the frontend lint and production build.

## 2026-09-28 — Connect the API to the Person 1 Hindsight module

### Change

- Replaced the Person 2 placeholder service with a lazy adapter to the existing Person 1 retain, analysis, and reassessment methods.
- Made decision recording fail when Hindsight retention fails, removing the provisional in-memory record so a successful API response means memory retention was confirmed.
- Mapped Hindsight failures to safe API responses and aligned the backend's optional failure reason with the Person 1 schema.

### How the feature works

The first memory operation creates a Hindsight client from server environment variables and sets up the bank once. The service boundary translates the backend's payload objects into the Person 1 module's function arguments. A decision is placed in the in-memory model while its retain runs; if retain fails, it is removed and the API returns an error. Reassessment requires a stored decision and preserves its historical content. Hindsight keys stay on the server.

### Process

Compared the two service interfaces, connected them at the existing boundary, adjusted failure handling and tests, and ran the full API and memory test suite with local loopback access.

## 2026-09-28 — Merge the Person 2 Express backend

### Change

- Brought the Person 2 routes, validation, in-memory decision model, service boundary, error handling, and API tests into the Person 1 branch.
- Combined the Express and Hindsight dependencies and environment examples, then converted the imported backend files to ES modules so they run under the existing project package configuration.

### How the feature works

The Express app exposes health, decision, analysis, and reassessment routes. At this merge stage, the decision model keeps records in process memory and the Person 1 service boundary is still a placeholder. The following integration change will connect it to the Hindsight module and align the API response shape with the frontend.

### Process

Fetched `origin/person-2` after updating `main`, merged it into the Person 1 branch, resolved four add/add configuration conflicts, regenerated the lockfile, and ran both API and memory tests with local loopback access.

## 2026-09-28 — Load authoritative records for live history views

### Change

- Made live memory cards load selected decision details through the planned decision-detail route.
- Made live assumption checks list all stored decisions, including newly recorded ones.
- Removed local fixture details from live match cards and added loading and error views for record detail.

### How the feature works

The Person 1 analysis result supplies the decision ID and recalled facts. The frontend uses that ID to fetch the full historical record through `GET /api/decisions/:id`, since Hindsight facts are not guaranteed to contain the entire original decision. Assumption Check fetches `GET /api/decisions` before presenting its selector. In demo mode, the shared fixtures remain the source of displayed records.

### Process

Followed the memory module's documented distinction between recalled facts and authoritative records, then updated the two match views and reassessment selector to use the planned backend routes. Verified lint and the production build.

## 2026-09-28 — Add the decision-recording frontend

### Change

- Added a decision form with the Person 1 record fields and a live decision-list view.
- Added loading, empty, and error states for the decision list and save operation.
- Kept the read-only seeded records in demo mode and labeled live records separately.

### How the feature works

With a backend URL configured, the page loads `GET /api/decisions`. A submitted form creates a UUID and date, sends `POST /api/decisions`, and adds the returned record to the page after success. Person 2's backend remains responsible for authoritative storage, validation, and calling Hindsight retain. Without a backend URL, the page shows the three shared fixtures and explains that recording is unavailable.

### Process

Mapped the requirements' decision fields to the existing Person 1 schema, kept multiline lists as arrays, and implemented the documented route contract. Verified lint and the production build.

## 2026-09-28 — Show live assumption reassessment in the frontend

### Change

- Wired the assumption form to the planned reassessment route when a backend URL is configured.
- Added loading and retryable error views, original-assumption context, and a separate current reassessment panel.
- Limited the local demo to read-only prepared examples so custom text cannot appear to have been analyzed.

### How the feature works

The user selects a seeded decision and enters changed circumstances. The frontend sends its ID and the new text to `POST /api/reassess`, then displays the Person 1 module's status, reason, challenged assumptions, and evidence gaps. The decision card and source fixture are not modified. Without the backend, the page displays only the prepared example for each fixture.

### Process

Used the existing Person 1 reassessment return fields and the documented route name. Kept the browser free of Hindsight credentials, added separate demo and live behaviors, and checked lint and the production build.

## 2026-09-28 — Prepare live proposal analysis in the frontend

### Change

- Added an opt-in frontend API client for proposal analysis and converted returned decision groups into memory cards.
- Displayed recalled fact text and IDs separately from current analysis, with explicit no-match and request-error states.
- Kept local keyword matching as a clearly labeled demo when no backend URL is configured.

### How the feature works

With `VITE_API_BASE_URL`, the inbox sends a proposal to `POST /api/analyze` and renders `decision_matches` from the Person 1 module. The selected group shows its recalled source facts, while the generated summary appears in a separate analysis panel. Without that URL, the frontend uses the shared seed records and labels the results as demo matches. The Hindsight credential stays on the backend.

### Process

Compared the Person 1 return shape with the frontend component props, added a small API adapter, and kept a demo fallback so the frontend remains inspectable while Person 2 builds the routes. Checked the frontend build and lint after the change.

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

## 2026-09-27 — Add repeatable decision memory fixtures

### Change

- Added three engineering decision fixtures covering a failed notification migration, a successful database index, and a blocked permissions cache.
- Added a seed command and expanded the live smoke command to exercise recall for all three decisions, proposal analysis, and changed-assumption reassessment.

### How the feature works

Each fixture uses a stable decision ID, which becomes a stable Hindsight document ID. Repeated seeding replaces that document's memory rather than accumulating duplicates. The smoke command checks that each fixture can be recalled by a related proposal.

### Process

Prepared distinct scenarios from the project's planned demo needs, then wired the existing retain, recall, analyze, and reassess methods into repeatable scripts.

## 2026-09-27 — Classify Hindsight integration failures

### Change

- Added stable `MemoryAiError` codes and stages for authorization, credits, service availability, rejected requests, and invalid responses.
- Added a retryability flag and tests for the main provider failure cases.

### How the feature works

The backend can map each code to an appropriate API response or user message while keeping provider details in the server-side error cause. Invalid structured output is reported distinctly from an unavailable Hindsight service.

### Process

Mapped the Hindsight client's HTTP status errors at the service boundary and checked the error contract with a mocked client. Left input validation separate from provider failures.

## 2026-09-27 — Verify the live Hindsight demo path

### Change

- Added an unrelated-proposal assertion to the repeatable live smoke command.
- Recorded the outcome of a live Cloud retain, recall, analysis, and reassessment check.

### How the feature works

The smoke command seeds stable decisions, verifies related recall, checks structured analysis and reassessment, then confirms that an unrelated proposal has no accepted decision match even when Recall returns candidate facts.

### Process

Used the local ignored `.env` to run the live integration twice without printing or committing the API key. Three decision recalls passed, the WebSocket proposal produced supported fact matches, the changed proxy scenario returned `may_have_changed`, and an unrelated proposal returned zero relevant decisions. Match counts varied between runs, so the repeatable check verifies expected decision IDs and outcomes.

## 2026-09-28 — Merge the frontend into the Person 1 branch

### Change

- Merged the React and Vite frontend from `feat/person-3-frontend` into `feat/person-1-memory-ai`.
- Kept the frontend branch and its history intact.

### How the feature works

The frontend currently presents a proposal inbox, memory matches, decision records, assumption checks, and a timeline using local demo data. The Person 1 module provides server-side Hindsight retain, recall, analysis, and reassessment methods. An HTTP backend is still needed to connect the two at runtime.

### Process

Merged the frontend branch into a clean Person 1 worktree, reviewed the staged files, and checked for conflicts. The merge had none.

## 2026-09-28 — Align the frontend demo with Person 1 records

### Change

- Made the frontend demo import the same three decision fixtures used by Hindsight seeding, with UI-only presentation details kept in the frontend.
- Aligned decision IDs, assumption examples, and timeline events with those fixtures; removed made-up match percentages and labeled local demo output clearly.
- Replaced the Vite page title and favicon with PRECEDENT branding, removed unused starter icons, rewrote the README instructions, and corrected the inbox selection state to pass the React lint rule.

### How the feature works

The frontend adapts the shared decision records for display, then uses a local keyword search to demonstrate proposal matching. Person 1's Hindsight module independently retains and recalls the same record IDs. An HTTP backend must connect the UI to live Hindsight results; the API key stays server-side.

### Process

Compared the frontend mock records and labels with the Person 1 fixture schema and service return fields. Reused the fixtures as the source of demo decision content, adjusted the UI examples, corrected the lint finding, and documented the current data flow and setup commands.

## 2026-09-28 — Allow the shared fixture in Vite development

### Change

- Allowed Vite's development server to serve the single shared demo fixture imported by the frontend.

### How the feature works

The frontend imports `fixtures/demo-decisions.js` from the repository root. Vite's file serving allow list now includes that file and its normal workspace root, so the browser can load the demo in development. The server-side `.env` file is outside the added file allowance.

### Process

The production build passed, but the running development server returned 403 for the shared fixture. Checked Vite's `server.fs.allow` documentation, narrowed the added allowance to the fixture file, and verified the served module again.

## 2026-09-28 — Integrate Person 1 branch into main

### Change

- Merged `feat/person-1-memory-ai` into `main`, restoring the PRECEDENT frontend, Hindsight-backed API, shared decision fixtures, and project documentation that had been removed by the earlier revert on `main`.
- Preserved the Person 1 branch and its existing commit history.

### How the feature works

The merged application connects the frontend workflow to the Express API. The API retains decisions in Hindsight, recalls source facts for proposal analysis, and reassesses decisions when circumstances change. The canonical decision and timeline records remain in the backend store.

### Process

Merged the feature branch into `main`. The earlier revert had removed files that were modified on the feature branch, so those conflicts were resolved using the feature branch versions. Kept the unrelated pre-existing planning-document deletions out of the merge.

## 2026-09-29 — Restore runtime files omitted from main

### Change

- Restored the frontend package manifest, lockfile, React entry point, supporting components and assets, and the two Hindsight seed and smoke scripts.

### How the feature works

Vite reads `frontend/package.json` and loads `frontend/src/main.jsx` from `frontend/index.html`; the restored entry point renders the existing PRECEDENT app. The root package scripts again resolve to `scripts/seed-decisions.js` and `scripts/memory-smoke.js`.

### Process

Compared the merged `main` tree with the Person 1 branch. The earlier revert had deleted files that were unchanged on the feature branch, so Git kept those deletions during the merge. Restored those exact files from the feature branch commit before the frontend Node.js documentation update.
## 2026-09-29 — Clarify the frontend Node.js requirement

### Change

- Declared the Vite 8 Node.js requirement in the frontend package metadata and documented the exact supported versions in both setup guides.

### How the feature works

Vite 8 and its Rolldown bundler require Node.js `^20.19.0 || >=22.12.0`. Older runtimes such as Node.js 20.9 lack the `node:util.styleText` export used by the bundler and fail before the development server starts.

### Process

Checked the installed Vite and Rolldown package engine declarations against the reported `styleText` import error, then aligned package metadata and setup docs with those declared engine ranges.

## 2026-09-29 — Prioritize the next PRECEDENT implementations

### Change

- Added a ranked implementation review covering collection access, recoverable Hindsight retention, reviewed imports, follow-up outcomes, and connection and memory-quality checks.
- Linked the review from the project README.

### How the feature works

The review maps each proposal to current code behavior, an implementation path, and an observable completion criterion. It distinguishes planned roadmap features from gaps found in the running API and frontend; no product behavior changes in this documentation commit.

### Process

Reviewed the tracked project documents, API routes, canonical storage, Hindsight module and scripts, and frontend flows on `main`. Compared current behavior with the existing flexible-memory roadmap and checked relevant Hindsight documentation before ranking the work.

## 2026-09-29 — Make decision retention recoverable

### Change

- Replaced the single-process JSON snapshot store with SQLite for canonical records, events, collections, and an outbox of Hindsight retention jobs.
- Added pending and failed indexing states, automatic retries, a manual retry API, and corresponding Decision Records controls.
- Added one-time import of an existing JSON snapshot into a new SQLite database.

### How the feature works

Recording saves the decision and retention job together, then attempts synchronous Hindsight Retain. Successful retention marks the record ready and adds its timeline event; only ready decisions appear in search. A retryable failure stays pending with backoff, and a nonretryable failure can be retried manually. Stable Hindsight document IDs let an expired lease be processed again after a crash. Details are in [storage and retention](docs/storage-and-retention.md).

### Process

Reviewed the retain-before-file-write failure in the existing orchestrator, added a transactional SQLite model and outbox worker, updated the API and UI states, and verified restart recovery, legacy import, pending visibility, and frontend compilation.
