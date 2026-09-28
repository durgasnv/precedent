import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { demoDecisions } from '../fixtures/demo-decisions.js';

const directory = mkdtempSync(join(tmpdir(), 'precedent-store-'));
process.env.DECISION_STORE_PATH = join(directory, 'default.json');
const { DecisionModel } = await import('../src/models/decision.js');
test.after(() => rmSync(directory, { recursive: true, force: true }));

test('records survive restart and IDs do not restart or reuse a caller ID', () => {
  const filePath = join(directory, 'restart.json');
  const first = new DecisionModel({ filePath, seeds: [] });
  const record = first.create(demoDecisions[0]);
  const restarted = new DecisionModel({ filePath, seeds: [] });
  assert.deepEqual(restarted.getById(record.id), record);
  const second = restarted.create(demoDecisions[0]);
  assert.notEqual(record.id, second.id);
  assert.notEqual(record.id, demoDecisions[0].id);
  const copy = restarted.getById(record.id);
  copy.assumptions.push('Mutated externally');
  assert.deepEqual(restarted.getById(record.id).assumptions, record.assumptions);
});

test('preparing a decision does not expose it before retention succeeds', () => {
  const store = new DecisionModel({ seeds: [] });
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
  const store = new DecisionModel({ filePath });
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
  const filePath = join(directory, 'migration.json');
  writeFileSync(filePath, JSON.stringify({ version: 1, decisions: [demoDecisions[0]] }));
  const store = new DecisionModel({ filePath });
  assert.equal(store.getAll()[0].id, demoDecisions[0].id);
  assert.equal(store.getAll()[0].collection_id, 'demo');
  assert.equal(JSON.parse(readFileSync(filePath, 'utf8')).version, 2);
});
