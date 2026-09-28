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

Set `VITE_API_BASE_URL` to the backend origin before starting Vite to enable live proposal analysis, for example `VITE_API_BASE_URL=http://localhost:3000 npm run dev`. The frontend sends `POST /api/analyze` with `{ "proposal": "..." }` and expects the Person 1 module result with `decision_matches`, `analysis`, and `no_match_reason`. It displays returned fact text and IDs separately from generated analysis. Decision details for the three seed records remain available locally; the backend will need to supply other record details through its decision routes. The API must allow requests from the frontend origin or be reverse proxied. Keep `HINDSIGHT_API_KEY` on the backend. The frontend needs no access to the key.
