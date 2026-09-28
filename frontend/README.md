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

`src/mockData.js` imports the three records in `../fixtures/demo-decisions.js`, the same records used by the Hindsight seed and smoke scripts. It adds presentation details and prepared reassessment examples. Proposal matching is a local keyword demonstration. The UI labels these records and assessments as demo content; it does not call Hindsight yet.

The backend will eventually expose decision, analysis, and reassessment routes and map `decision_id` and source fact IDs from the Person 1 module into UI records. Keep `HINDSIGHT_API_KEY` on that server. The frontend needs no access to the key.
