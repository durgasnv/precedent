/**
 * Decision Memory Model & In-Memory Data Store
 *
 * Schema structure as documented in plan.md and requirements.md:
 * - id: string (unique identifier)
 * - title: string (required)
 * - problem: string (required)
 * - approach: string (required)
 * - outcome: string (required)
 * - failure_reason: string (required)
 * - alternatives: array of strings (optional, default [])
 * - decision: string (required)
 * - assumptions: array of strings (optional, default [])
 * - reconsider_when: array of strings (optional, default [])
 * - evidence: array of strings (optional, default [])
 * - date: string (optional, default YYYY-MM)
 * - createdAt: ISO string
 */

import { demoDecisions } from '../../fixtures/demo-decisions.js';

let idCounter = 1;

const seedDecisions = demoDecisions.map(record => ({
  ...record,
  createdAt: `${record.date}T00:00:00.000Z`,
}));

class DecisionModel {
  constructor() {
    this.decisions = [...seedDecisions];
  }

  /**
   * Format array or string inputs safely into array of strings
   */
  static formatArrayField(field) {
    if (!field) return [];
    if (Array.isArray(field)) return field.map(item => String(item).trim()).filter(Boolean);
    if (typeof field === "string") return [field.trim()].filter(Boolean);
    return [];
  }

  /**
   * Get all stored decision records
   */
  getAll() {
    return [...this.decisions];
  }

  /**
   * Get a single decision record by ID
   */
  getById(id) {
    if (!id) return null;
    return this.decisions.find(d => d.id === String(id)) || null;
  }

  removeById(id) {
    this.decisions = this.decisions.filter(decision => decision.id !== id);
  }

  /**
   * Create and store a new decision record
   */
  create(data) {
    const now = new Date();
    const defaultDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const newDecision = {
      id: `dec_${idCounter++}`,
      title: String(data.title).trim(),
      problem: String(data.problem).trim(),
      approach: String(data.approach).trim(),
      outcome: String(data.outcome).trim(),
      failure_reason: String(data.failure_reason ?? '').trim(),
      alternatives: DecisionModel.formatArrayField(data.alternatives),
      decision: String(data.decision).trim(),
      assumptions: DecisionModel.formatArrayField(data.assumptions),
      reconsider_when: DecisionModel.formatArrayField(data.reconsider_when),
      evidence: DecisionModel.formatArrayField(data.evidence),
      date: data.date ? String(data.date).trim() : defaultDate,
      createdAt: now.toISOString()
    };

    this.decisions.push(newDecision);
    return newDecision;
  }
}

// Export singleton instance
export default new DecisionModel();
