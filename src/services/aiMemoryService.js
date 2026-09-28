import { createMemoryAiFromEnv } from '../memory-ai.js';

class ServiceNotConnectedError extends Error {
  constructor(message) {
    super(message || 'Person 1 Memory & AI service is not connected.');
    this.name = 'ServiceNotConnectedError';
    this.statusCode = 503;
    this.code = 'SERVICE_UNAVAILABLE';
  }
}

class AIMemoryServiceBoundary {
  constructor() {
    this.provider = null;
    this.setupPromise = null;
  }

  /**
   * Register Person 1's live Memory/AI service implementation.
   * Expected provider interface:
   * {
   *   retainDecision: async (decision) => { ... },
   *   analyzeProposal: async (payload) => { ... },
   *   reassessAssumptions: async (payload) => { ... }
   * }
   */
  registerProvider(provider) {
    this.provider = provider;
    this.setupPromise = null;
  }

  async getProvider() {
    if (this.provider) return this.provider;
    if (!process.env.HINDSIGHT_BASE_URL || !process.env.HINDSIGHT_BANK_ID) {
      throw new ServiceNotConnectedError('Hindsight is not configured on the server.');
    }
    const memory = createMemoryAiFromEnv();
    this.provider = {
      retainDecision: (decision) => memory.retainDecision(decision),
      analyzeProposal: ({ proposal }) => memory.analyzeProposal(proposal),
      reassessAssumptions: ({ decisionRecord, changedCircumstances }) =>
        memory.reassessDecision(decisionRecord, changedCircumstances),
    };
    this.setupPromise = memory.setupBank().catch((error) => {
      this.provider = null;
      this.setupPromise = null;
      throw error;
    });
    return this.provider;
  }

  async readyProvider() {
    const provider = await this.getProvider();
    if (this.setupPromise) await this.setupPromise;
    return provider;
  }

  /**
   * Check if Person 1's provider is currently connected.
   */
  isConnected() {
    return Boolean(this.provider || (process.env.HINDSIGHT_BASE_URL && process.env.HINDSIGHT_BANK_ID));
  }

  /**
   * Retain a technical decision in Hindsight memory.
   */
  async retainDecision(decision) {
    const provider = await this.readyProvider();
    return provider.retainDecision(decision);
  }

  /**
   * Recall related past decisions and analyze a proposal using LLM reasoning.
   */
  async analyzeProposal(payload) {
    const provider = await this.readyProvider();
    return provider.analyzeProposal(payload);
  }

  /**
   * Reassess historical assumptions against changed circumstances.
   */
  async reassessAssumptions(payload) {
    const provider = await this.readyProvider();
    if (!provider.reassessAssumptions) throw new ServiceNotConnectedError('Reassessment is unavailable.');
    return provider.reassessAssumptions(payload);
  }
}

const aiMemoryService = new AIMemoryServiceBoundary();
export { aiMemoryService, ServiceNotConnectedError };
