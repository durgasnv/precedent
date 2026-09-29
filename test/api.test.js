/**
 * End-to-End Test Suite for PRECEDENT Backend API
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createHash } from 'node:crypto';

import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { aiMemoryService, ServiceNotConnectedError } from '../src/services/aiMemoryService.js';

const storageDirectory = mkdtempSync(join(tmpdir(), 'precedent-api-'));
process.env.DECISION_DB_PATH = join(storageDirectory, 'decisions.sqlite');
process.env.DECISION_STORE_PATH = join(storageDirectory, 'legacy.json');
const { default: app } = await import('../src/app.js');
const { default: decisionModel } = await import('../src/models/decision.js');
const owner = decisionModel.createUser('API test owner');

let server;
let baseUrl;

test.before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });
});

test.after(async () => {
  await new Promise((resolve) => {
    server.close(resolve);
  });
  rmSync(storageDirectory, { recursive: true, force: true });
});

// Helper for HTTP requests
function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const reqHeaders = { Authorization: 'Bearer ' + owner.token, ...headers };
    let payload = null;

    if (body !== null) {
      if (typeof body === 'string') {
        payload = body;
      } else {
        payload = JSON.stringify(body);
        reqHeaders['Content-Type'] = 'application/json';
      }
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(url, { method, headers: reqHeaders }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch {
          parsed = data;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: parsed
        });
      });
    });

    req.on('error', reject);
    if (payload !== null) req.write(payload);
    req.end();
  });
}

test('1. GET /api/health - Health check endpoint', async () => {
  const res = await request('GET', '/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.status, 'ok');
  assert.equal(res.body.service, 'precedent-backend');
  assert.ok(res.body.timestamp);
});

test('all decision routes require a valid access token', async () => {
  const denied = await request('GET', '/api/decisions', null, { Authorization: '' });
  assert.equal(denied.status, 401);
  assert.equal(denied.body.error.code, 'UNAUTHORIZED');
  const health = await request('GET', '/api/health', null, { Authorization: '' });
  assert.equal(health.status, 200);
});

test('users can access only their own collections and records', async () => {
  const other = decisionModel.createUser('Second API user');
  const headers = { Authorization: 'Bearer ' + other.token };
  const collections = await request('GET', '/api/collections', null, headers);
  assert.equal(collections.status, 200);
  assert.equal(collections.body.data.length, 1);
  assert.notEqual(collections.body.data[0].id, 'demo');
  const cross = { ...headers, 'X-Precedent-Collection': 'demo' };
  const list = await request('GET', '/api/decisions', null, cross);
  assert.equal(list.status, 404);
  const record = await request('GET', '/api/decisions/demo-websocket-notifications', null, cross);
  assert.equal(record.status, 404);
  const analysis = await request('POST', '/api/analyze', { proposal: 'Try WebSockets again' }, cross);
  assert.equal(analysis.status, 404);
  const own = await request('GET', '/api/decisions', null, {
    ...headers, 'X-Precedent-Collection': collections.body.data[0].id,
  });
  assert.deepEqual(own.body.data, []);
});

test('2. GET /api/decisions - List seed decisions', async () => {
  const res = await request('GET', '/api/decisions');
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.ok(Array.isArray(res.body.data));
  assert.equal(res.body.count, 3);
  assert.equal(res.body.data[0].id, 'demo-websocket-notifications');
  assert.equal(res.body.data[0].title, 'WebSocket notification migration');
});

test('3. GET /api/decisions/:id - Inspect existing decision', async () => {
  const res = await request('GET', '/api/decisions/demo-websocket-notifications');
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.id, 'demo-websocket-notifications');
  assert.equal(res.body.data.decision, 'Use Server-Sent Events for notifications');
});

test('4. GET /api/decisions/:id - Inspect non-existent decision', async () => {
  const res = await request('GET', '/api/decisions/non_existent_999');
  assert.equal(res.status, 404);
  assert.equal(res.body.error.code, 'NOT_FOUND');
});

test('5. POST /api/decisions - Record new decision (valid payload)', async () => {
  aiMemoryService.registerProvider({ retainDecision: async () => ({ retained: true }) });
  const payload = {
    title: 'GraphQL API migration',
    problem: 'Reduce frontend network requests',
    approach: 'Replace REST with GraphQL',
    outcome: 'Increased latency and complex client caching',
    failure_reason: 'Deep nested queries caused N+1 DB bottlenecks',
    alternatives: ['REST with field filtering'],
    decision: 'Maintain REST API with sparse fieldsets',
    assumptions: ['GraphQL client complexity outweighs overfetching benefits'],
    reconsider_when: ['DataLoader and automated caching layer are in place']
  };

  const res = await request('POST', '/api/decisions', payload);
  assert.equal(res.status, 201);
  assert.equal(res.body.success, true);
  assert.ok(res.body.data.id);
  assert.equal(res.body.data.title, 'GraphQL API migration');
  assert.ok(res.body.retentionStatus);

  // Verify it appears in GET /api/decisions
  const listRes = await request('GET', '/api/decisions');
  assert.equal(listRes.body.count, 4);
  aiMemoryService.registerProvider(null);
});

test('6. POST /api/decisions - Record decision with missing required fields', async () => {
  const payload = {
    title: 'Incomplete decision',
    problem: 'Testing validation'
    // missing approach, outcome, decision
  };

  const res = await request('POST', '/api/decisions', payload);
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
  assert.ok(res.body.error.details.length >= 3);
});

test('failed Hindsight retention leaves a recoverable pending decision outside search', async () => {
  aiMemoryService.registerProvider({ retainDecision: async () => { throw new ServiceNotConnectedError(); } });
  const before = await request('GET', '/api/decisions');
  const response = await request('POST', '/api/decisions', {
    title: 'Failed retain', problem: 'Check memory', approach: 'Try a new plan',
    outcome: 'Unknown', failure_reason: '', decision: 'Wait for evidence',
  });
  const after = await request('GET', '/api/decisions');
  assert.equal(response.status, 202);
  assert.equal(response.body.data.retention_status, 'pending');
  assert.equal(after.body.count, before.body.count);
  const pending = await request('GET', '/api/decisions/pending');
  assert.ok(pending.body.data.some(item => item.id === response.body.data.id));
  aiMemoryService.registerProvider(null);
});

test('7. POST /api/analyze - Without Person 1 integration provider (503 Service Unavailable)', async () => {
  const res = await request('POST', '/api/analyze', {
    proposal: 'Let us migrate notifications to WebSockets'
  });
  assert.equal(res.status, 503);
  assert.equal(res.body.error.code, 'SERVICE_UNAVAILABLE');
  assert.ok(res.body.error.message.includes('Hindsight'));
});

test('8. POST /api/analyze - With missing required payload (400 Bad Request)', async () => {
  const res = await request('POST', '/api/analyze', {});
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
});

test('9. POST /api/analyze - With Person 1 integration connected', async () => {
  // Mock registration of Person 1 provider
  aiMemoryService.registerProvider({
    retainDecision: async (d) => ({ connected: true, retained: true }),
    analyzeProposal: async (p) => ({
      recalledMemory: {
        id: 'demo-websocket-notifications',
        title: 'WebSocket notification migration',
        failure_reason: 'Corporate proxies caused unstable connections'
      },
      relevanceScore: 0.95,
      explanation: 'A similar proposal was attempted previously and failed due to corporate proxy limitations.'
    }),
    reassessAssumptions: async (r) => ({
      status: 'potentially changed',
      analysis: 'Corporate proxy router changes indicate old blocker may no longer apply.'
    })
  });

  const res = await request('POST', '/api/analyze', {
    proposal: 'Let us migrate notifications to WebSockets'
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.recalledMemory.id, 'demo-websocket-notifications');
  assert.ok(res.body.data.explanation);
});

test('10. POST /api/reassess - With Person 1 integration connected', async () => {
  const res = await request('POST', '/api/reassess', {
    decisionId: 'demo-websocket-notifications',
    changedCircumstances: 'Enterprise customers now use proxy bypass network infrastructure'
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.status, 'potentially changed');
  const timeline = await request('GET', '/api/timeline');
  assert.ok(timeline.body.data.some(event => event.kind === 'reassessed' && event.decision_id === 'demo-websocket-notifications'));
});

test('11. POST /api/reassess - Missing changedCircumstances field (400 Bad Request)', async () => {
  const res = await request('POST', '/api/reassess', {
    decisionId: 'demo-websocket-notifications'
  });
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
});

test('12. Malformed JSON payload test (400 Invalid JSON)', async () => {
  const res = await request('POST', '/api/decisions', '{ malformed json string', {
    'Content-Type': 'application/json'
  });
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'INVALID_JSON');
});

test('13. Unknown route (404 Not Found)', async () => {
  const res = await request('GET', '/api/unknown_route');
  assert.equal(res.status, 404);
  assert.equal(res.body.error.code, 'NOT_FOUND');
});

test('collection API starts empty and rejects cross-collection record access', async () => {
  const created = await request('POST', '/api/collections', { name: 'New infrastructure example' });
  assert.equal(created.status, 201);
  const headers = { 'X-Precedent-Collection': created.body.data.id };
  const empty = await request('GET', '/api/decisions', null, headers);
  assert.deepEqual(empty.body.data, []);
  const emptyTimeline = await request('GET', '/api/timeline', null, headers);
  assert.deepEqual(emptyTimeline.body.data, []);
  const hidden = await request('GET', '/api/decisions/demo-websocket-notifications', null, headers);
  assert.equal(hidden.status, 404);
  const reassess = await request('POST', '/api/reassess', {
    decisionId: 'demo-websocket-notifications', changedCircumstances: 'A different network',
  }, headers);
  assert.equal(reassess.status, 404);
  const invalid = await request('GET', '/api/decisions', null, { 'X-Precedent-Collection': 'missing' });
  assert.equal(invalid.status, 404);
  const saved = await request('POST', '/api/decisions', {
    title: 'New example', problem: 'A problem', approach: 'An approach', outcome: 'An outcome', decision: 'A decision',
  }, headers);
  assert.equal(saved.status, 201);
  const outside = await request('GET', `/api/decisions/${saved.body.data.id}`);
  assert.equal(outside.status, 404);
  const inside = await request('GET', `/api/decisions/${saved.body.data.id}`, null, headers);
  assert.equal(inside.status, 200);
  const timeline = await request('GET', '/api/timeline', null, headers);
  assert.deepEqual(timeline.body.data.map(event => event.kind), ['recorded']);
});

test('reviewed import preserves exact source passages and collection ownership', async () => {
  const text = 'Title: WebSocket gateway\nProblem: Reduce polling\nApproach: Use WebSockets\nOutcome: Proxy connections failed\nDecision: Keep SSE';
  const sha256 = createHash('sha256').update(text).digest('hex');
  const fields = {
    title: 'WebSocket gateway', problem: 'Reduce polling', approach: 'Use WebSockets',
    outcome: 'Proxy connections failed', failure_reason: '', decision: 'Keep SSE',
  };
  const passages = Object.fromEntries(Object.keys(fields).map(key => {
    const value = fields[key];
    return [key, value ? { text: value, start: text.indexOf(value) } : null];
  }));
  aiMemoryService.registerProvider({
    retainDecision: async () => ({ retained: true }),
    draftFromDocument: async () => ({ draft: fields, passages, missing_fields: ['failure_reason'] }),
  });
  const preview = await request('POST', '/api/imports/preview', { text, filename: 'decision.md' });
  assert.equal(preview.status, 200);
  assert.equal(preview.body.data.source.sha256, sha256);
  const bad = await request('POST', '/api/imports', {
    text, filename: 'decision.md', sourceHash: sha256, draft: fields,
    passages: { ...passages, outcome: { text: 'Fabricated', start: 0 } },
  });
  assert.equal(bad.status, 400);
  const saved = await request('POST', '/api/imports', {
    text, filename: 'decision.md', sourceHash: sha256, draft: fields, passages,
  });
  assert.equal(saved.status, 201);
  assert.equal(saved.body.data.retention_status, 'ready');
  const id = saved.body.data.id;
  const source = await request('GET', '/api/decisions/' + id + '/source');
  assert.equal(source.status, 200);
  assert.equal(source.body.data.content, text);
  assert.deepEqual(source.body.data.passages.outcome, passages.outcome);
  const other = decisionModel.createUser('Import access test user');
  const denied = await request('GET', '/api/decisions/' + id + '/source', null,
    { Authorization: 'Bearer ' + other.token, 'X-Precedent-Collection': 'demo' });
  assert.equal(denied.status, 404);
  aiMemoryService.registerProvider(null);
});
