# Canonical storage and Hindsight retention

PRECEDENT stores collections, decisions, timeline events, and retention jobs in SQLite at `DECISION_DB_PATH` (default `data/precedent.sqlite`). The database uses WAL and a busy timeout so more than one API process can share the same file on a persistent local disk. Keep the database and its WAL files backed up together. The Hindsight bank remains a separate memory system.

## Recording flow

1. `POST /api/decisions` validates the decision and assigns a UUID.
2. `DecisionModel.queue` inserts the canonical decision with `pending` status and its outbox job in one database transaction.
3. `RetentionService` claims the job with a lease and calls Hindsight Retain using the stable document ID `decision:<id>`.
4. After Retain succeeds, one database transaction marks the decision `ready`, completes the outbox job, and adds its timeline event.
5. `GET /api/decisions` and proposal matching expose only ready decisions. `GET /api/decisions/pending` shows pending or failed jobs. `POST /api/decisions/:id/retry` retries a failed job in the selected collection.

The request attempts retention immediately. It returns HTTP 201 when ready or HTTP 202 while indexing is pending or failed. The server also processes due outbox jobs after startup and every ten seconds. Retryable failures use bounded exponential delay; nonretryable failures wait for a manual retry. The frontend shows these states in Decision Records.

If the process crashes after Hindsight retained the document but before SQLite marks it ready, the lease eventually expires and the job is claimed again. Re-retaining the same `decision:<id>` document is idempotent for this purpose. The original history is added only when the ready transition commits. Provider errors stored with pending jobs use the service's safe public messages.

## Migration and setup

On an empty SQLite database, the model imports an existing version 1–3 JSON snapshot from `DECISION_STORE_PATH` (default `data/decisions.json`). It preserves decision and collection IDs and timeline events. The JSON file is not rewritten. If no JSON snapshot exists, the three shared examples are initialized as before. Back up the JSON file before first startup; after confirming the import, back up SQLite regularly.

The in-memory database option is for tests. Production should use a persistent filesystem for `DECISION_DB_PATH`. Keep the Hindsight credentials only in the backend `.env`; the frontend requires only `VITE_API_BASE_URL`.

## Verification process

The storage tests cover restart and legacy import. The retention tests simulate a process stopping after a job is claimed, then a second process reclaiming it without creating duplicate history. They also check that a failed job stays out of search until a successful retry.
