import { demoDecisions } from '../fixtures/demo-decisions.js';
import { createMemoryAiFromEnv } from '../src/memory-ai.js';

const memory = createMemoryAiFromEnv();
await memory.setupBank();
for (const decision of demoDecisions) {
  await memory.retainDecision(decision);
  console.log(`Retained ${decision.id}`);
}
