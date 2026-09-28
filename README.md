# PRECEDENT

PRECEDENT is an institutional memory application for technical decisions and engineering experiments. This branch contains a React frontend, an Express API, and a Hindsight memory module. The backend and memory module are connected; the browser uses the API when `VITE_API_BASE_URL` is configured.

## Run the frontend demo

Use Node.js 24 or another version supported by the frontend's Vite dependency. From the repository root:

```bash
cd frontend
npm ci
npm run dev
```

Open the local URL printed by Vite. The UI does not need a Hindsight key. See [the frontend guide](frontend/README.md) for the demo behavior.

## Use the memory module

From the repository root, run `npm ci` and `npm test`. Configure the ignored `.env` using `.env.example`, then run `npm run memory:smoke` to test against a Hindsight instance. Keep the Hindsight API key on the server; do not add it to frontend environment variables.

## Run the live workflow

Configure `.env` at the repository root with the Hindsight instance URL, bank ID, and API key if required. Run `npm ci`, then `npm run memory:seed` to retain the three shared demo records in Hindsight. Start the API with `npm start`; it listens on port 5000 by default. In `frontend`, copy `.env.example` to `.env`, run `npm ci`, and start Vite with `npm run dev`. The frontend then uses the Express routes for decision recording, analysis, and reassessment. The backend's authoritative decision list is currently held in process memory and resets on restart, while Hindsight keeps retained facts.

## Project documents

- [Problem statement](problem_statement.md)
- [Requirements](requirements.md)
- [Project plan](plan.md)
- [Build phases](phases.md)
- [Content submission plan](content-submission-plan.md)
- [Change log and workflow](CHANGELOG.md)
- [Memory and AI module](docs/memory-ai.md)
- [Flexible decision memory roadmap](docs/flexible-memory-roadmap.md)
