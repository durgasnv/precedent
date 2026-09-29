import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DecisionModel } from '../src/models/decision.js';
import { RetentionService } from '../src/services/retentionService.js';
import { demoDecisions } from '../fixtures/demo-decisions.js';

test('a claimed job survives restart and produces one visible decision and event', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'precedent-outbox-'));
  const filePath = join(directory, 'decisions.sqlite');
  const first = new DecisionModel({ filePath, legacyPath: null, seeds: [] });
  const record = first.prepare(demoDecisions[0]);
  first.queue(record);
  assert.equal(first.getById(record.id), null);
  assert.equal(first.claimRetention(record.id).id, record.id);
  first.close();

  const second = new DecisionModel({ filePath, legacyPath: null, seeds: [] });
  second.db.prepare('UPDATE outbox SET lease_until=0 WHERE decision_id=?').run(record.id);
  const retained = [];
  const service = new RetentionService({ store: second, memory: {
    retainDecision: async item => retained.push(item.id),
  } });
  assert.deepEqual(await service.processOne(record.id), { state: 'ready' });
  assert.deepEqual(retained, [record.id]);
  assert.equal(second.getById(record.id).id, record.id);
  assert.deepEqual(second.getTimeline().filter(event => event.decision_id === record.id)
    .map(event => event.kind), ['recorded']);
  assert.equal(await service.processOne(record.id), null);
  second.close();
  rmSync(directory, { recursive: true, force: true });
});

test('failed retention stays recoverable and never appears as ready before success', async () => {
  const store = new DecisionModel({ filePath: null, seeds: [] });
  const record = store.prepare(demoDecisions[0]);
  store.queue(record);
  const service = new RetentionService({ store, memory: {
    retainDecision: async () => { const error = new Error('Provider unavailable'); error.retryable = false; throw error; },
  } });
  assert.deepEqual(await service.processOne(record.id), { state: 'failed', message: 'Provider unavailable' });
  assert.equal(store.getById(record.id), null);
  assert.equal(store.getPending()[0].retention_status, 'failed');
  assert.equal(store.retryRetention(record.id, 'demo'), true);
  service.memory = { retainDecision: async () => ({ retained: true }) };
  assert.deepEqual(await service.processOne(record.id), { state: 'ready' });
  assert.equal(store.getById(record.id).id, record.id);
  assert.deepEqual(store.getPending(), []);
  store.close();
});
