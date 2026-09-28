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
      if (this.state.version !== 1 || !Array.isArray(this.state.decisions) ||
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

  getAll() {
    return structuredClone(this.state.decisions);
  }

  getById(id) {
    return structuredClone(this.state.decisions.find(record => record.id === id) || null);
  }

  prepare(data) {
    const now = new Date().toISOString();
    return {
      ...validateDecision({ ...data, id: randomUUID(), date: data.date || now.slice(0, 10) }),
      createdAt: now,
    };
  }

  insert(record) {
    if (this.getById(record.id)) throw new Error('A decision with this ID already exists.');
    this.commit({ ...this.state, decisions: [...this.state.decisions, record] });
    return structuredClone(record);
  }

  create(data) {
    return this.insert(this.prepare(data));
  }
}

export default new DecisionModel({ filePath: resolve(process.env.DECISION_STORE_PATH || 'data/decisions.json') });
