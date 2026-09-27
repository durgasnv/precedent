# Memory and AI module

This is Person 1's backend module. It exports `createMemoryAi({ client, bankId })` for dependency injection and `createMemoryAiFromEnv()` for a configured Hindsight client. The HTTP routes and UI are separate team tasks.

## How it works

1. `setupBank()` creates or updates a PRECEDENT bank with instructions to extract decision context and distinguish history from analysis.
2. `retainDecision(record)` validates the record, writes its full context as one Hindsight document, and adds `decision_id` metadata. The stable `decision:<id>` document ID makes a later retain of the same decision replace its earlier version. Retain is synchronous so a following recall can use it.
3. `recallRelated(proposal)` searches the bank and returns fact IDs, fact text, source fact references, source document IDs, decision IDs, and ranking scores. Scores are for ranking within a query, not universal confidence percentages.
4. `analyzeProposal(proposal)` recalls first, then asks Hindsight Reflect whether any facts are actually relevant. The returned `memories` are historical evidence; `analysis` is current generated interpretation. Empty or irrelevant recall returns `analysis: null` and a `no_match_reason`. Generated match IDs outside the recalled evidence are discarded. Relevant facts are grouped by `decision_id` in `decision_matches`, with the source facts and explanations kept together.
5. `reassessDecision(record, changedCircumstances)` compares new information with the supplied historical record. It returns `still_relevant`, `may_have_changed`, or `insufficient_information`, plus reasoning and evidence gaps. It does not rewrite the original record.

The record shape uses `id`, `title`, `problem`, `approach`, `outcome`, `failure_reason`, `alternatives`, `decision`, `assumptions`, `reconsider_when`, optional `evidence`, and optional `date`. The first six fields except `failure_reason` are required non-empty strings; list fields are arrays of strings. `failure_reason` can be empty for a successful experiment. A full date is passed to Hindsight as the event timestamp; a partial date such as `2026-04` stays in the retained text without inventing a specific day.

The backend should store the authoritative decision record separately. Hindsight extracts facts from retained content, so recall can return several facts from one decision and does not guarantee a complete copy of the original record. Use `decision_id` to link a recalled fact to the stored record.

Provider failures throw `MemoryAiError` with a `code`, `stage`, and `retryable` flag. Codes are `HINDSIGHT_AUTH`, `HINDSIGHT_CREDITS`, `HINDSIGHT_UNAVAILABLE`, `HINDSIGHT_REQUEST_FAILED`, and `HINDSIGHT_INVALID_RESPONSE`. Input validation still throws `TypeError`. The public error message omits provider details; backend logs can inspect `cause` without exposing credentials or provider responses to clients. Retain writes are not automatically retried by this module.

## Setup and verification

Requires Node.js 20 or later. Run `npm ci` and `npm test` for the module tests. Copy `.env.example` to `.env` and set `HINDSIGHT_BASE_URL`, `HINDSIGHT_BANK_ID`, and, for Hindsight Cloud, `HINDSIGHT_API_KEY`. Keep `.env` out of version control.

For Cloud, register at [Hindsight Cloud](https://ui.hindsight.vectorize.io/), create an API key, and use `https://api.hindsight.vectorize.io` as the base URL. For a self hosted instance, use its API URL (commonly `http://localhost:8888`); an API key is only needed if that server requires one. The hackathon information supplied to the team says promo code `MEMHACK99` provides $50 in Cloud credits and is entered in Billing **after registration**. Billing and promo redemption are optional account steps, outside the code setup.

With a configured, reachable Hindsight instance, run `npm run memory:seed` to retain three stable demo decisions: WebSocket notifications, a successful PostgreSQL partial index, and a Redis permissions cache with a safety blocker. Re-running the command replaces each document with the same ID. Run `npm run memory:smoke` to seed those decisions, check all three recall queries, analyze the WebSocket proposal, and reassess its changed proxy assumption. These commands write the fixtures to the configured bank. A Cloud account, API key, and live instance are needed to verify this integration end to end; the automated tests use a mock client and do not contact Hindsight.

## Sources

- [Hindsight JavaScript client](https://hindsight.vectorize.io/sdks/nodejs)
- [Hindsight retain API](https://hindsight.vectorize.io/developer/api/retain)
- [Hindsight recall API](https://hindsight.vectorize.io/developer/api/recall)
- [Hindsight reflect and structured output](https://hindsight.vectorize.io/developer/api/reflect)
- [Hindsight Cloud API setup](https://docs.hindsight.vectorize.io/typescript-sdk/)
