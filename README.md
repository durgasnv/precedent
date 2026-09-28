# PRECEDENT

PRECEDENT is an institutional memory application for technical decisions and engineering experiments. This branch contains a React frontend demo and a server-side Hindsight memory module. The frontend currently uses the same seeded decision records as the memory module through local demo matching; HTTP routes are still needed to connect it to live recall.

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

## Project documents

- [Problem statement](problem_statement.md)
- [Requirements](requirements.md)
- [Project plan](plan.md)
- [Build phases](phases.md)
- [Content submission plan](content-submission-plan.md)
- [Change log and workflow](CHANGELOG.md)
- [Memory and AI module](docs/memory-ai.md)
