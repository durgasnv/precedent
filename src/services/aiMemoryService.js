import { createMemoryAiFromEnv } from '../memory-ai.js';

export class ServiceNotConnectedError extends Error {
  constructor(message = 'Hindsight is not configured on the server.') {
    super(message);
    this.name = 'ServiceNotConnectedError';
    this.statusCode = 503;
    this.code = 'SERVICE_UNAVAILABLE';
  }
}

export function bankForCollection(baseBank, collectionId) {
  if (collectionId === 'demo') return baseBank;
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(collectionId)) {
    throw new TypeError('Invalid collection ID.');
  }
  return `${baseBank}--${collectionId}`;
}

export class AIMemoryServiceBoundary {
  constructor({ createMemory = createMemoryAiFromEnv, env = process.env } = {}) {
    this.createMemory = createMemory;
    this.env = env;
    this.provider = null;
    this.providers = new Map();
  }

  registerProvider(provider) {
    this.provider = provider;
    this.providers.clear();
  }

  async readyProvider(collectionId = 'demo') {
    if (this.provider) return this.provider;
    if (!this.env.HINDSIGHT_BASE_URL || !this.env.HINDSIGHT_BANK_ID) throw new ServiceNotConnectedError();
    if (!this.providers.has(collectionId)) {
      const ready = (async () => {
        const memory = this.createMemory({ ...this.env,
          HINDSIGHT_BANK_ID: bankForCollection(this.env.HINDSIGHT_BANK_ID, collectionId),
        });
        await memory.setupBank();
        return {
          retainDecision: (decision) => memory.retainDecision(decision),
          analyzeProposal: ({ proposal }) => memory.analyzeProposal(proposal),
          reassessAssumptions: ({ decisionRecord, changedCircumstances }) =>
            memory.reassessDecision(decisionRecord, changedCircumstances),
        };
      })();
      this.providers.set(collectionId, ready);
      ready.catch(() => this.providers.delete(collectionId));
    }
    return this.providers.get(collectionId);
  }

  isConnected() {
    return Boolean(this.provider || (this.env.HINDSIGHT_BASE_URL && this.env.HINDSIGHT_BANK_ID));
  }

  async retainDecision(decision, collectionId = 'demo') {
    const provider = await this.readyProvider(collectionId);
    return provider.retainDecision(decision);
  }

  async analyzeProposal(payload) {
    const provider = await this.readyProvider(payload.collectionId);
    return provider.analyzeProposal(payload);
  }

  async reassessAssumptions(payload) {
    const provider = await this.readyProvider(payload.collectionId);
    if (!provider.reassessAssumptions) throw new ServiceNotConnectedError('Reassessment is unavailable.');
    return provider.reassessAssumptions(payload);
  }
}

export const aiMemoryService = new AIMemoryServiceBoundary();
