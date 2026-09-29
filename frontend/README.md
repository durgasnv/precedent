# PRECEDENT frontend

This React and Vite frontend demonstrates the planned decision workflow: propose a change, review related decision records, inspect original blockers, compare changed assumptions, and browse a timeline.

## Run

Vite 8 requires Node.js `^20.19.0 || >=22.12.0`. Node.js 20.9 is too old; use Node.js 22.12 or newer (Node.js 24 is also supported).

```bash
npm ci
npm run dev
```

Open the local URL printed by Vite. `npm run build` checks the production bundle, and `npm run lint` checks the source.

## Current data flow

Without `VITE_API_BASE_URL`, `src/mockData.js` imports the three records in `../fixtures/demo-decisions.js`, the same records used by the Hindsight seed and smoke scripts. Proposal matching is a local keyword demonstration, labeled as demo content.

Copy `.env.example` to `.env` in this directory, or set `VITE_API_BASE_URL=http://localhost:5000` before starting Vite, to enable the merged Express API. The frontend first asks for an operator-issued personal access token and sends it as a bearer token on API requests. The frontend sends `POST /api/analyze` with `{ "proposal": "..." }`. The API wraps the Person 1 result in `{ "success": true, "data": ... }`; the client unwraps it and displays recalled fact text and IDs separately from generated analysis. Set `CORS_ORIGINS` on the backend to the actual frontend origin. Keep `HINDSIGHT_API_KEY` on the backend. The frontend needs no access to that key.

In live mode, Assumption Check loads the decision list, then sends `POST /api/reassess` with `{ "decisionId": "...", "changedCircumstances": "..." }`. It renders the returned status, reason, challenged assumptions, and evidence gaps while leaving the historical record unchanged. The inbox and Memory Match load the authoritative selected record through `GET /api/decisions/:id`, keeping its historical detail separate from the recalled facts and current analysis. In demo mode, the circumstance field is read-only and the button shows one prepared example for the selected seed decision; it does not claim to reassess arbitrary input.

In live mode, Decision Records loads `GET /api/decisions` and offers a form that sends `POST /api/decisions` with the Person 1 record fields. The backend assigns a UUID and saves the record with a Hindsight retention job in one SQLite transaction. A ready record appears in the list; a record still waiting for Hindsight appears in a separate indexing section with refresh and retry controls. In demo mode, records remain read-only examples.

## Different examples

The live collection picker lists saved collections and creates an empty one from a name. The Engineering examples collection contains the original fixtures. Every record, analysis, and reassessment request sends `X-Precedent-Collection`; the backend uses that collection's records and Hindsight bank. Switching collections remounts the workspace, clearing the proposal, results, selected record, and unsaved form state. A pending request belongs to the old workspace and cannot put its result into the new one. Collections persist on the server; a page reload starts in Engineering examples.

Optional Additional context fields on the decision form capture project, team, technologies, constraints, and measurements. Supplied details are stored with the record and retained in Hindsight. The live Timeline loads `GET /api/timeline` for the selected collection and shows dated recording and reassessment events. Reassessment events preserve the new circumstances, generated status, reason, challenged assumptions, and evidence gaps separately from the historical decision. The offline demo still uses the prepared timeline.
