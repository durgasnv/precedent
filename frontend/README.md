# PRECEDENT frontend

This React and Vite frontend demonstrates the planned decision workflow: propose a change, review related decision records, inspect original blockers, compare changed assumptions, and browse a timeline.

## Run

Use Node.js 24 or a Node version supported by the Vite version in `package-lock.json`.

```bash
npm ci
npm run dev
```

Open the local URL printed by Vite. `npm run build` checks the production bundle, and `npm run lint` checks the source.

## Current data flow

Without `VITE_API_BASE_URL`, `src/mockData.js` imports the three records in `../fixtures/demo-decisions.js`, the same records used by the Hindsight seed and smoke scripts. Proposal matching is a local keyword demonstration, labeled as demo content.

Copy `.env.example` to `.env` in this directory, or set `VITE_API_BASE_URL=http://localhost:5000` before starting Vite, to enable the merged Express API. The frontend sends `POST /api/analyze` with `{ "proposal": "..." }`. The API wraps the Person 1 result in `{ "success": true, "data": ... }`; the client unwraps it and displays recalled fact text and IDs separately from generated analysis. Express already allows the frontend origin through CORS. Keep `HINDSIGHT_API_KEY` on the backend. The frontend needs no access to the key.

In live mode, Assumption Check loads the decision list, then sends `POST /api/reassess` with `{ "decisionId": "...", "changedCircumstances": "..." }`. It renders the returned status, reason, challenged assumptions, and evidence gaps while leaving the historical record unchanged. The inbox and Memory Match load the authoritative selected record through `GET /api/decisions/:id`, keeping its historical detail separate from the recalled facts and current analysis. In demo mode, the circumstance field is read-only and the button shows one prepared example for the selected seed decision; it does not claim to reassess arbitrary input.

In live mode, Decision Records loads `GET /api/decisions` and offers a form that sends `POST /api/decisions` with the Person 1 record fields. The backend assigns the ID, stores the record in process memory, calls `retainDecision`, and returns the saved record in `data`. The frontend displays it only after the backend confirms success. In demo mode, records remain read-only examples.
