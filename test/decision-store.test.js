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
