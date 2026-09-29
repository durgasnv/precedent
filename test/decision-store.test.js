import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { demoDecisions } from '../fixtures/demo-decisions.js';

const directory = mkdtempSync(join(tmpdir(), 'precedent-store-'));
process.env.DECISION_DB_PATH = join(directory, 'default.sqlite');
process.env.DECISION_STORE_PATH = join(directory, 'legacy.json');
const { DecisionModel } = await import('../src/models/decision.js');
test.after(() => rmSync(directory, { recursive: true, force: true }));

test('records survive restart and IDs do not restart or reuse a caller ID', () => {
  const filePath = join(directory, 'restart.json');
  const first = new DecisionModel({ filePath, legacyPath: null, seeds: [] });
  const record = first.create(demoDecisions[0]);
  const restarted = new DecisionModel({ filePath, legacyPath: null, seeds: [] });
  assert.deepEqual(restarted.getById(record.id), record);
  const second = restarted.create(demoDecisions[0]);
  assert.notEqual(record.id, second.id);
  assert.notEqual(record.id, demoDecisions[0].id);
  const copy = restarted.getById(record.id);
  copy.assumptions.push('Mutated externally');
  assert.deepEqual(restarted.getById(record.id).assumptions, record.assumptions);
});

test('preparing a decision does not expose it before retention succeeds', () => {
  const store = new DecisionModel({ filePath: null, seeds: [] });
  const draft = store.prepare(demoDecisions[0]);
  assert.equal(store.getById(draft.id), null);
  store.insert(draft);
  assert.equal(store.getAll().length, 1);
});

test('invalid storage fails without overwriting the file', () => {
  const filePath = join(directory, 'invalid.json');
  writeFileSync(filePath, '{broken');
  assert.throws(() => new DecisionModel({ filePath }));
  assert.equal(readFileSync(filePath, 'utf8'), '{broken');
});

test('collections start empty, isolate records, and survive restart', () => {
  const filePath = join(directory, 'collections.json');
  const store = new DecisionModel({ filePath, legacyPath: null });
  const collection = store.createCollection('Database migration');
  assert.deepEqual(store.getAll(collection.id), []);
  assert.equal(store.getById(demoDecisions[0].id, collection.id), null);
  const record = store.create(demoDecisions[1], collection.id);
  assert.equal(store.getById(record.id), null);
  const restarted = new DecisionModel({ filePath });
  assert.deepEqual(restarted.getCollection(collection.id), collection);
  assert.deepEqual(restarted.getAll(collection.id), [record]);
});

test('version 1 records migrate into the demo collection without changing IDs', () => {
  const filePath = join(directory, 'migration.sqlite');
  const legacyPath = join(directory, 'migration.json');
  writeFileSync(legacyPath, JSON.stringify({ version: 1, decisions: [demoDecisions[0]] }));
  const store = new DecisionModel({ filePath, legacyPath });
  assert.equal(store.getAll()[0].id, demoDecisions[0].id);
  assert.equal(store.getAll()[0].collection_id, 'demo');
  assert.equal(JSON.parse(readFileSync(legacyPath, 'utf8')).version, 1);
});

test('recording and reassessment history survives restart in its collection', () => {
  const filePath = join(directory, 'history.json');
  const first = new DecisionModel({ filePath, legacyPath: null, seeds: [] });
  const collection = first.createCollection('Notifications');
  const record = first.create(demoDecisions[0], collection.id);
  first.addReassessment(record.id, collection.id, 'Proxy policy changed', {
    status: 'may_have_changed', reason: 'The old blocker may be gone',
    challenged_assumptions: ['Corporate proxy remains'], evidence_gaps: ['Connection test'],
  });
  assert.deepEqual(first.getTimeline(), []);
  const events = new DecisionModel({ filePath, legacyPath: null, seeds: [] }).getTimeline(collection.id);
  assert.deepEqual(events.map(event => event.kind), ['recorded', 'reassessed']);
  assert.equal(events[1].assessment.status, 'may_have_changed');
  assert.equal(events[1].changed_circumstances, 'Proxy policy changed');
});

test('operator-issued tokens are hashed and legacy collections belong to the first user', () => {
  const store = new DecisionModel({ filePath: null, seeds: [] });
  const owner = store.createUser('First user');
  assert.equal(store.getUserByToken(owner.token).id, owner.id);
  assert.equal(store.listCollections(owner.id)[0].id, 'demo');
  const second = store.createUser('Second user');
  assert.equal(store.getCollection('demo', second.id), null);
  assert.equal(store.listCollections(second.id).length, 1);
  const rotated = store.rotateUserToken('First user');
  assert.equal(store.getUserByToken(owner.token), null);
  assert.equal(store.getUserByToken(rotated).id, owner.id);
  const stored = store.db.prepare('SELECT token_hash FROM users WHERE id=?').get(owner.id);
  assert.notEqual(stored.token_hash, rotated);
  store.close();
});
