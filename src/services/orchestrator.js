/**
 * Orchestrator Service / Controller Layer
 *
 * Coordinates flow between API routes, the Decision data model,
 * and Person 1's Memory + AI integration service boundary.
 */

import decisionModel from '../models/decision.js';
import { aiMemoryService } from './aiMemoryService.js';

class OrchestratorService {
  /**
   * List all stored technical decision records.
   */
  async listDecisions() {
    return decisionModel.getAll();
  }

  /**
   * Get a single decision record by ID.
   */
  async getDecisionById(id) {
    return decisionModel.getById(id);
  }

  /**
   * Record a new technical decision.
   * Flow: validate/assign ID -> Person 1 retain -> persist record -> response
   */
  async recordDecision(data) {
    const createdDecision = decisionModel.prepare(data);
    const retentionResult = await aiMemoryService.retainDecision(createdDecision);
    decisionModel.insert(createdDecision);

    return {
      decision: createdDecision,
      retentionStatus: retentionResult
    };
  }

  /**
   * Analyze a new technical proposal against historical memory.
   * Flow: validation (via middleware) -> Person 1 memory recall & LLM analysis -> response
   */
  async analyzeProposal(payload) {
    // Delegates to Person 1's AI & Memory service boundary
    const analysisResult = await aiMemoryService.analyzeProposal({
      proposal: payload.proposal,
      context: payload.context || null
    });

    return analysisResult;
  }

  /**
   * Reassess a historical decision given changed circumstances.
   * Flow: validation (via middleware) -> Person 1 assumption comparison -> response
   */
  async reassessDecision(payload) {
    let targetDecision = null;
    if (payload.decisionId) {
      targetDecision = decisionModel.getById(payload.decisionId);
    }

    if (!targetDecision) {
      const error = new Error('Decision record not found.');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    // Delegates to Person 1's AI & Memory service boundary
    const reassessmentResult = await aiMemoryService.reassessAssumptions({
      decisionId: payload.decisionId || null,
      decisionRecord: targetDecision,
      proposal: payload.proposal || null,
      changedCircumstances: payload.changedCircumstances
    });

    return reassessmentResult;
  }
}

export default new OrchestratorService();
