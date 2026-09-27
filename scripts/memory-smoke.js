import { createMemoryAiFromEnv } from '../src/memory-ai.js';
import { demoDecisions } from '../fixtures/demo-decisions.js';

const memory = createMemoryAiFromEnv();
await memory.setupBank();

for (const decision of demoDecisions) {
  await memory.retainDecision(decision);
}

const scenarios = [
  { proposal: 'Should notifications move from SSE to WebSockets?', expectedId: 'demo-websocket-notifications' },
  { proposal: 'Should we use a partial PostgreSQL index for active orders?', expectedId: 'demo-postgres-index' },
  { proposal: 'Could Redis cache account permissions for ten minutes?', expectedId: 'demo-redis-cache' },
];
const recalls = [];
for (const scenario of scenarios) {
  const memories = await memory.recallRelated(scenario.proposal);
  if (!memories.some((item) => item.decision_id === scenario.expectedId)) {
    throw new Error(`Smoke test failed: ${scenario.expectedId} was not recalled`);
  }
  recalls.push({ decision_id: scenario.expectedId, recalled_facts: memories.length });
}

const analysis = await memory.analyzeProposal(scenarios[0].proposal);
if (!analysis.decision_matches.some((item) => item.decision_id === scenarios[0].expectedId)) {
  throw new Error('Smoke test failed: the WebSocket decision was not accepted as a relevant match');
}
const reassessment = await memory.reassessDecision(
  demoDecisions[0],
  'Enterprise customers now use network infrastructure without the former proxy restriction.',
);

console.log(JSON.stringify({
  retained_decision_ids: demoDecisions.map((decision) => decision.id),
  recalls,
  analysis: analysis.analysis,
  reassessment,
}, null, 2));
