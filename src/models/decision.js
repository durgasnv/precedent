import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { demoDecisions } from '../../fixtures/demo-decisions.js';
import { validateDecision } from '../memory-ai.js';

// Atomic snapshots for one backend process. Use a persistent disk in deployment.
export class DecisionModel {
  constructor({ filePath = null, seeds = demoDecisions } = {}) {
    this.filePath = filePath;
    if (filePath && existsSync(filePath)) {
      this.state = JSON.parse(readFileSync(filePath, 'utf8'));
      if (![1, 2].includes(this.state.version) || !Array.isArray(this.state.decisions) ||
          this.state.decisions.some(record => typeof record.id !== 'string') ||
          new Set(this.state.decisions.map(record => record.id)).size !== this.state.decisions.length) {
        throw new Error('Decision storage is invalid. Restore a valid backup before starting the server.');
      }
    } else {
      this.state = { version: 1, decisions: seeds.map(record => ({
        ...structuredClone(record), createdAt: `${record.date}T00:00:00.000Z`,
      })) };
      this.commit(this.state);
    }
    if (this.state.version === 1) {
      this.commit({ ...this.state, version: 2,
        collections: [{ id: 'demo', name: 'Engineering examples' }],
        decisions: this.state.decisions.map(record => ({ ...record, collection_id: 'demo' })),
      });
    }
    if (!Array.isArray(this.state.collections) || !this.state.collections.some(item => item.id === 'demo') ||
        this.state.decisions.some(record => !this.state.collections.some(item => item.id === record.collection_id))) {
      throw new Error('Decision collections are invalid. Restore a valid backup before starting the server.');
    }
  }

  commit(next) {
    if (this.filePath) {
      mkdirSync(dirname(this.filePath), { recursive: true });
      const temporary = `${this.filePath}.${randomUUID()}.tmp`;
      try {
        writeFileSync(temporary, JSON.stringify(next, null, 2), { mode: 0o600, flag: 'wx' });
        renameSync(temporary, this.filePath);
      } finally {
        rmSync(temporary, { force: true });
      }
    }
    this.state = structuredClone(next);
  }

  listCollections() {
    return structuredClone(this.state.collections);
  }

  getCollection(id) {
    return structuredClone(this.state.collections.find(item => item.id === id) || null);
  }

  createCollection(name) {
    if (typeof name !== 'string' || !name.trim() || name.trim().length > 80) {
      throw new TypeError('Collection name must contain 1–80 characters.');
    }
    const collection = { id: randomUUID(), name: name.trim(), createdAt: new Date().toISOString() };
    this.commit({ ...this.state, collections: [...this.state.collections, collection] });
    return structuredClone(collection);
  }

  getAll(collectionId = 'demo') {
    return structuredClone(this.state.decisions.filter(record => record.collection_id === collectionId));
  }

  getById(id, collectionId = 'demo') {
    return structuredClone(this.state.decisions.find(record => record.id === id && record.collection_id === collectionId) || null);
  }

  prepare(data, collectionId = 'demo') {
    if (!this.getCollection(collectionId)) throw new TypeError('Unknown decision collection.');
    const now = new Date().toISOString();
    return {
      ...validateDecision({ ...data, id: randomUUID(), date: data.date || now.slice(0, 10) }),
      createdAt: now,
      collection_id: collectionId,
    };
  }

  insert(record) {
    if (!this.getCollection(record.collection_id)) throw new TypeError('Unknown decision collection.');
    if (this.state.decisions.some(item => item.id === record.id)) throw new Error('A decision with this ID already exists.');
    this.commit({ ...this.state, decisions: [...this.state.decisions, record] });
    return structuredClone(record);
  }

  create(data, collectionId = 'demo') {
    return this.insert(this.prepare(data, collectionId));
  }
}

export default new DecisionModel({ filePath: resolve(process.env.DECISION_STORE_PATH || 'data/decisions.json') });
