import { createMemoryAiFromEnv } from '../src/memory-ai.js';

const memory = createMemoryAiFromEnv();
await memory.setupBank();

const decision = {
  id: 'demo-websocket-notifications',
  title: 'WebSocket notification migration',
  problem: 'Reduce polling overhead',
  approach: 'Replace polling with WebSockets',
  outcome: 'Unstable enterprise customer connections',
  failure_reason: 'Restrictive corporate proxies interrupted WebSocket connections',
  alternatives: ['Server-Sent Events'],
  decision: 'Remain on Server-Sent Events',
  assumptions: ['Enterprise customers continue to use restrictive corporate proxies'],
  reconsider_when: ['Customer network constraints materially change'],
  evidence: ['Demo decision fixture'],
};

await memory.retainDecision(decision);
const memories = await memory.recallRelated('Should notifications move from SSE to WebSockets?');
if (!memories.some((item) => item.decision_id === decision.id)) {
  throw new Error('Smoke test failed: the retained decision was not recalled');
}

const analysis = await memory.analyzeProposal('Should notifications move from SSE to WebSockets?');
const reassessment = await memory.reassessDecision(
  decision,
  'Enterprise customers now use network infrastructure without the former proxy restriction.',
);

console.log(JSON.stringify({
  retained_decision_id: decision.id,
  recalled_facts: memories.length,
  analysis: analysis.analysis,
  reassessment,
}, null, 2));
