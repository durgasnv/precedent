/**
 * Orchestrator Service / Controller Layer
 *
 * Coordinates flow between API routes, the Decision data model,
 * and Person 1's Memory + AI integration service boundary.
 */

import decisionModel from '../models/decision.js';
import { aiMemoryService } from './aiMemoryService.js';
import { retentionService } from './retentionService.js';

class OrchestratorService {
  /**
   * List all stored technical decision records.
   */
  async listDecisions(collectionId) {
    return decisionModel.getAll(collectionId);
  }

  /**
   * Get a single decision record by ID.
   */
  async getDecisionById(id, collectionId) {
    return decisionModel.getById(id, collectionId);
  }

  async listTimeline(collectionId) {
    return decisionModel.getTimeline(collectionId);
  }

  /**
   * Record a new technical decision.
   * Flow: validate/assign ID -> transactional outbox -> retain -> mark ready
   */
  async recordDecision(data, collectionId, source = null) {
    const createdDecision = decisionModel.prepare(data, collectionId);
    if (source) createdDecision.source_id = source.id;
    decisionModel.queue(createdDecision, source);
    const retentionResult = await retentionService.processOne(createdDecision.id);

    return {
      decision: createdDecision,
      retentionStatus: retentionResult
    };
  }

  async listPendingDecisions(collectionId) {
    return decisionModel.getPending(collectionId);
  }

  async retryDecision(id, collectionId) {
    if (!decisionModel.retryRetention(id, collectionId)) {
      const error = new Error('No failed retention job was found for this decision.');
      error.statusCode = 404;
      throw error;
    }
    return retentionService.processOne(id);
  }

  /**
   * Analyze a new technical proposal against historical memory.
   * Flow: validation (via middleware) -> Person 1 memory recall & LLM analysis -> response
   */
  async analyzeProposal(payload) {
    // Delegates to Person 1's AI & Memory service boundary
    const analysisResult = await aiMemoryService.analyzeProposal({
      proposal: payload.proposal,
      collectionId: payload.collectionId,
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
      targetDecision = decisionModel.getById(payload.decisionId, payload.collectionId);
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
      collectionId: payload.collectionId,
      proposal: payload.proposal || null,
      changedCircumstances: payload.changedCircumstances
    });

    decisionModel.addReassessment(payload.decisionId, payload.collectionId, payload.changedCircumstances, reassessmentResult);

    return reassessmentResult;
  }
}

export default new OrchestratorService();
