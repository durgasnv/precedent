/**
 * Integration Boundary for Person 1 — Memory + AI (Hindsight & LLM)
 *
 * Person 1 owns:
 * - Hindsight integration (retain & recall)
 * - Structured prompt generation and LLM reasoning
 * - Assumption comparison logic
 *
 * Person 1 can connect their module here by calling `registerProvider(provider)`
 * or exporting their service functions matching this interface contract.
 */

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
  }

  /**
   * Check if Person 1's provider is currently connected.
   */
  isConnected() {
    return Boolean(this.provider && typeof this.provider.analyzeProposal === 'function');
  }

  /**
   * Retain a technical decision in Hindsight memory.
   */
  async retainDecision(decision) {
    if (this.provider && typeof this.provider.retainDecision === 'function') {
      return await this.provider.retainDecision(decision);
    }
    return {
      connected: false,
      retained: false,
      message: 'Person 1 Memory service provider not connected. Decision stored in local memory layer.'
    };
  }

  /**
   * Recall related past decisions and analyze a proposal using LLM reasoning.
   */
  async analyzeProposal(payload) {
    if (this.isConnected()) {
      return await this.provider.analyzeProposal(payload);
    }
    throw new ServiceNotConnectedError(
      'Person 1 Memory and AI service is not connected. See src/services/aiMemoryService.js to integrate Person 1 Hindsight/LLM modules.'
    );
  }

  /**
   * Reassess historical assumptions against changed circumstances.
   */
  async reassessAssumptions(payload) {
    if (this.isConnected() && typeof this.provider.reassessAssumptions === 'function') {
      return await this.provider.reassessAssumptions(payload);
    }
    throw new ServiceNotConnectedError(
      'Person 1 Assumption Reassessment service is not connected. See src/services/aiMemoryService.js to integrate Person 1 modules.'
    );
  }
}

const aiMemoryService = new AIMemoryServiceBoundary();
export { aiMemoryService, ServiceNotConnectedError };
