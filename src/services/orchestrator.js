/**
 * Orchestrator Service / Controller Layer
 * 
 * Coordinates flow between API routes, the Decision data model,
 * and Person 1's Memory + AI integration service boundary.
 */

const decisionModel = require('../models/decision');
const { aiMemoryService } = require('./aiMemoryService');

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
   * Flow: validation (via middleware) -> data store -> Person 1 retain -> response
   */
  async recordDecision(data) {
    // 1. Store decision in local backend model
    const createdDecision = decisionModel.create(data);

    // 2. Pass to Person 1 retain module interface
    let retentionResult;
    try {
      retentionResult = await aiMemoryService.retainDecision(createdDecision);
    } catch (err) {
      retentionResult = {
        connected: false,
        retained: false,
        error: err.message
      };
    }

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

module.exports = new OrchestratorService();
