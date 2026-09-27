import test from 'node:test';
import assert from 'node:assert/strict';
import { createMemoryAi, formatDecision, validateDecision } from '../src/memory-ai.js';

const decision = {
  id: 'websocket-notifications',
  title: 'WebSocket notifications',
  problem: 'Reduce polling',
  approach: 'Use WebSockets',
  outcome: 'Enterprise connections failed',
  failure_reason: 'Corporate proxies blocked connections',
  alternatives: ['Server-Sent Events'],
  decision: 'Use SSE',
  assumptions: ['Customers still use restrictive proxies'],
  reconsider_when: ['Proxy restrictions change'],
  evidence: ['ADR-42'],
};

function fakeClient(overrides = {}) {
  return {
    createBank: async () => ({}),
    retain: async () => ({}),
    recall: async () => ({ results: [] }),
    reflect: async () => ({ text: '', structured_output: {} }),
    ...overrides,
  };
}

test('retains the full decision with a stable document id and source metadata', async () => {
  let call;
  const memory = createMemoryAi({
    client: fakeClient({ retain: async (...args) => { call = args; return { success: true }; } }),
    bankId: 'test-bank',
  });
  const result = await memory.retainDecision(decision);
  assert.equal(call[0], 'test-bank');
  assert.match(call[1], /Corporate proxies blocked connections/);
  assert.match(call[1], /Proxy restrictions change/);
  assert.equal(call[2].documentId, 'decision:websocket-notifications');
  assert.equal(call[2].metadata.decision_id, decision.id);
  assert.equal(call[2].async, false);
  assert.equal(result.decision_id, decision.id);
});

test('recalls source identifiers and keeps an empty history distinct from an AI answer', async () => {
  let reflected = false;
  const memory = createMemoryAi({
    client: fakeClient({ reflect: async () => { reflected = true; return {}; } }),
    bankId: 'test-bank',
  });
  const result = await memory.analyzeProposal('Use WebSockets for notifications');
  assert.deepEqual(result.memories, []);
  assert.equal(result.analysis, null);
  assert.equal(reflected, false);
});

test('analyzes recalled history and discards citations outside the recalled evidence', async () => {
  const memory = createMemoryAi({
    client: fakeClient({
      recall: async () => ({ results: [{
        id: 'fact-1', text: 'Proxies blocked WebSockets', type: 'world',
        document_id: 'decision:websocket-notifications',
        metadata: { decision_id: decision.id },
      }] }),
      reflect: async (_bank, prompt, options) => {
        assert.match(prompt, /fact-1/);
        assert.equal(options.responseSchema.type, 'object');
        return {
          text: 'The prior proxy issue is relevant.',
          structured_output: {
            summary: 'A previous migration hit proxy restrictions.',
            matches: [
              { memory_id: 'fact-1', why_relevant: 'Same approach', historical_outcome: 'Failed', original_assumption: 'Proxies persist' },
              { memory_id: 'made-up', why_relevant: 'Unknown', historical_outcome: 'Unknown', original_assumption: 'Unknown' },
            ],
          },
        };
      },
    }),
    bankId: 'test-bank',
  });
  const result = await memory.analyzeProposal('Use WebSockets for notifications');
  assert.equal(result.memories[0].decision_id, decision.id);
  assert.equal(result.analysis.matches.length, 1);
  assert.equal(result.analysis.matches[0].memory_id, 'fact-1');
});

test('reassessment uses the supplied historical decision without changing it', async () => {
  const original = structuredClone(decision);
  const memory = createMemoryAi({
    client: fakeClient({ reflect: async (_bank, prompt) => {
      assert.match(prompt, /Corporate proxies blocked connections/);
      assert.match(prompt, /proxy restriction was removed/);
      return { text: 'The blocker may have changed.', structured_output: {
        status: 'may_have_changed', reason: 'Network path changed',
        challenged_assumptions: ['Customers still use restrictive proxies'],
        evidence_gaps: ['Connection reliability measurements'],
      } };
    } }),
    bankId: 'test-bank',
  });
  const result = await memory.reassessDecision(decision, 'The proxy restriction was removed');
  assert.equal(result.status, 'may_have_changed');
  assert.deepEqual(decision, original);
});

test('rejects incomplete decisions and missing structured output', async () => {
  assert.throws(() => validateDecision({ ...decision, problem: '' }), /decision.problem/);
  assert.match(formatDecision(validateDecision(decision)), /Final decision: Use SSE/);
  const memory = createMemoryAi({
    client: fakeClient({ reflect: async () => ({ text: 'unstructured' }) }),
    bankId: 'test-bank',
  });
  await assert.rejects(memory.reassessDecision(decision, 'Proxy changed'), /structured output/);
});
