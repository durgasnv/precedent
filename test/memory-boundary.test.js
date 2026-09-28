import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { AIMemoryServiceBoundary } from '../src/services/aiMemoryService.js';

test('all memory operations use the selected bank and setup is shared per collection', async () => {
  const calls = [];
  const boundary = new AIMemoryServiceBoundary({
    env: { HINDSIGHT_BASE_URL: 'http://unused', HINDSIGHT_BANK_ID: 'precedent' },
    createMemory: ({ HINDSIGHT_BANK_ID: bank }) => ({
      setupBank: async () => { calls.push([bank, 'setup']); },
      retainDecision: async record => { calls.push([bank, 'retain', record]); },
      analyzeProposal: async proposal => { calls.push([bank, 'analyze', proposal]); return { bank }; },
      reassessDecision: async (record, changed) => { calls.push([bank, 'reassess', record, changed]); },
    }),
  });
  const collectionId = randomUUID();
  const record = { id: 'record' };
  const [demo, custom] = await Promise.all([
    boundary.analyzeProposal({ proposal: 'Same proposal', collectionId: 'demo' }),
    boundary.analyzeProposal({ proposal: 'Same proposal', collectionId }),
  ]);
  assert.equal(demo.bank, 'precedent');
  assert.equal(custom.bank, `precedent--${collectionId}`);
  await boundary.retainDecision(record, collectionId);
  await boundary.reassessAssumptions({ decisionRecord: record, changedCircumstances: 'New evidence', collectionId });
  assert.equal(calls.filter(([bank, method]) => bank === custom.bank && method === 'setup').length, 1);
  assert.deepEqual(calls.find(([, method]) => method === 'reassess'), [custom.bank, 'reassess', record, 'New evidence']);
  assert.deepEqual(calls.find(([, method]) => method === 'retain'), [custom.bank, 'retain', record]);
});
