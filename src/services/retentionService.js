import decisionModel from '../models/decision.js';
import { aiMemoryService } from './aiMemoryService.js';

export class RetentionService {
  constructor({ store = decisionModel, memory = aiMemoryService } = {}) {
    this.store = store;
    this.memory = memory;
    this.timer = null;
  }

  async processOne(id) {
    const record = this.store.claimRetention(id);
    if (!record) return null;
    try {
      await this.memory.retainDecision(record, record.collection_id);
      this.store.markRetained(id);
      return { state: 'ready' };
    } catch (error) {
      const retryable = error.retryable !== false;
      const message = typeof error.message === 'string' ? error.message : 'Hindsight retention failed.';
      this.store.markRetentionFailure(id, message, retryable);
      return { state: retryable ? 'pending' : 'failed', message };
    }
  }

  async runDue() {
    for (const id of this.store.dueRetentionIds()) {
      await this.processOne(id);
    }
  }

  start(intervalMs = 10000) {
    if (this.timer) return;
    const tick = () => this.runDue().catch(error => console.error('[RETENTION] Outbox processing failed:', error));
    void tick();
    this.timer = setInterval(tick, intervalMs);
    this.timer.unref();
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }
}

export const retentionService = new RetentionService();
