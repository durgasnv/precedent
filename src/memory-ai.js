import { HindsightClient } from '@vectorize-io/hindsight-client';

const ANALYSIS_SCHEMA = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    matches: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          memory_id: { type: 'string' },
          why_relevant: { type: 'string' },
          historical_outcome: { type: 'string' },
          original_assumption: { type: 'string' },
        },
        required: ['memory_id', 'why_relevant', 'historical_outcome', 'original_assumption'],
      },
    },
  },
  required: ['summary', 'matches'],
};

const REASSESSMENT_SCHEMA = {
  type: 'object',
  properties: {
    status: {
      type: 'string',
      enum: ['still_relevant', 'may_have_changed', 'insufficient_information'],
    },
    reason: { type: 'string' },
    challenged_assumptions: { type: 'array', items: { type: 'string' } },
    evidence_gaps: { type: 'array', items: { type: 'string' } },
  },
  required: ['status', 'reason', 'challenged_assumptions', 'evidence_gaps'],
};

const REQUIRED_DECISION_FIELDS = ['id', 'title', 'problem', 'approach', 'outcome', 'decision'];
const OPTIONAL_LIST_FIELDS = ['alternatives', 'assumptions', 'reconsider_when', 'evidence'];

function nonEmptyString(value, label) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new TypeError(`${label} must be a non-empty string`);
  }
  return value.trim();
}

export function validateDecision(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('decision must be an object');
  }
  const decision = {};
  for (const field of REQUIRED_DECISION_FIELDS) {
    decision[field] = nonEmptyString(input[field], `decision.${field}`);
  }
  decision.failure_reason = input.failure_reason == null ? '' : String(input.failure_reason).trim();
  for (const field of OPTIONAL_LIST_FIELDS) {
    const value = input[field] ?? [];
    if (!Array.isArray(value) || value.some((item) => typeof item !== 'string' || !item.trim())) {
      throw new TypeError(`decision.${field} must be an array of non-empty strings`);
    }
    decision[field] = value.map((item) => item.trim());
  }
  if (input.date != null) decision.date = nonEmptyString(input.date, 'decision.date');
  return decision;
}

export function formatDecision(decision) {
  const lines = [
    `Technical decision: ${decision.title}`,
    `Problem or goal: ${decision.problem}`,
    `Approach attempted: ${decision.approach}`,
    `Outcome: ${decision.outcome}`,
    `Why it failed or succeeded: ${decision.failure_reason || 'Not recorded'}`,
    `Alternatives considered: ${decision.alternatives.join('; ') || 'Not recorded'}`,
    `Final decision: ${decision.decision}`,
    `Original assumptions or blockers: ${decision.assumptions.join('; ') || 'Not recorded'}`,
    `Reconsider when: ${decision.reconsider_when.join('; ') || 'Not recorded'}`,
    `Evidence or references: ${decision.evidence.join('; ') || 'Not recorded'}`,
  ];
  if (decision.date) lines.push(`Decision date: ${decision.date}`);
  return lines.join('\n');
}

function recalledMemories(response) {
  if (!Array.isArray(response?.results)) throw new Error('Hindsight recall returned no results array');
  return response.results.map((item) => ({
    id: nonEmptyString(item.id, 'Hindsight result id'),
    text: item.text,
    type: item.type,
    document_id: item.document_id ?? null,
    decision_id: item.metadata?.decision_id ?? null,
    source_fact_ids: item.source_fact_ids ?? [],
    source_facts: (item.source_fact_ids ?? []).map((id) => response.source_facts?.[id]).filter(Boolean).map((source) => ({
      id: source.id,
      text: source.text,
      document_id: source.document_id ?? null,
      decision_id: source.metadata?.decision_id ?? null,
    })),
    scores: item.scores ?? null,
  }));
}

function structuredResponse(response, requiredFields) {
  const output = response?.structured_output;
  if (!output || typeof output !== 'object' || Array.isArray(output) ||
      requiredFields.some((field) => !(field in output))) {
    throw new Error(`Hindsight reflect did not return valid structured output${response?.structured_output_error ? `: ${response.structured_output_error}` : ''}`);
  }
  return output;
}

export function createMemoryAi({ client, bankId }) {
  if (!client || !['retain', 'recall', 'reflect', 'createBank'].every((method) => typeof client[method] === 'function')) {
    throw new TypeError('client must provide Hindsight retain, recall, reflect, and createBank methods');
  }
  const bank = nonEmptyString(bankId, 'bankId');
  const recallRelated = async (proposal) => {
    const query = nonEmptyString(proposal, 'proposal');
    const response = await client.recall(bank, query, {
      budget: 'mid',
      maxTokens: 4096,
      includeSourceFacts: true,
    });
    return recalledMemories(response);
  };

  return {
    async setupBank() {
      return client.createBank(bank, {
        name: 'PRECEDENT technical decisions',
        retainMission: 'Extract technical goals, attempted approaches, outcomes, causes, final decisions, assumptions, and conditions for reconsideration. Preserve uncertainty and source context.',
        reflectMission: 'Help engineers understand prior technical decisions. Distinguish recorded history from current analysis, cite evidence, and leave final decisions to humans.',
      });
    },

    async retainDecision(input) {
      const decision = validateDecision(input);
      const result = await client.retain(bank, formatDecision(decision), {
        documentId: `decision:${decision.id}`,
        context: 'PRECEDENT technical decision record',
        metadata: { decision_id: decision.id, title: decision.title },
        ...(decision.date && /^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(decision.date) ? { timestamp: decision.date } : {}),
        async: false,
      });
      return { decision_id: decision.id, document_id: `decision:${decision.id}`, result };
    },

    recallRelated,

    async analyzeProposal(proposal) {
      const query = nonEmptyString(proposal, 'proposal');
      const memories = await recallRelated(query);
      if (memories.length === 0) {
        return { proposal: query, memories, analysis: null };
      }
      const evidence = memories.map(({ id, text, decision_id }) => ({ id, text, decision_id }));
      const prompt = [
        'Analyze this new technical proposal against the recorded technical decisions.',
        `Proposal: ${query}`,
        `Recalled evidence: ${JSON.stringify(evidence)}`,
        'Explain why each useful memory relates to the proposal. Use only memory_id values from the recalled evidence.',
        'Separate historical facts from your current interpretation. Do not invent outcomes or assumptions. If unknown, say so.',
        'An old failure is not a permanent prohibition. The engineer makes the final decision.',
      ].join('\n');
      const response = await client.reflect(bank, prompt, {
        budget: 'mid',
        responseSchema: ANALYSIS_SCHEMA,
        includeFacts: true,
      });
      const output = structuredResponse(response, ['summary', 'matches']);
      if (typeof output.summary !== 'string' || !Array.isArray(output.matches)) {
        throw new Error('Hindsight analysis has an invalid structure');
      }
      const allowedIds = new Set(memories.map(({ id }) => id));
      const matches = output.matches.filter((match) =>
        match && allowedIds.has(match.memory_id) &&
        ['why_relevant', 'historical_outcome', 'original_assumption'].every((field) => typeof match[field] === 'string'));
      return { proposal: query, memories, analysis: { summary: output.summary, matches, text: response.text } };
    },

    async reassessDecision(input, changedCircumstances) {
      const decision = validateDecision(input);
      const changed = nonEmptyString(changedCircumstances, 'changedCircumstances');
      const prompt = [
        'Compare new circumstances with the original assumptions of this historical technical decision.',
        `Historical decision: ${formatDecision(decision)}`,
        `New circumstances supplied by the engineer: ${changed}`,
        'Preserve the historical outcome. Identify the challenged assumptions and missing evidence.',
        'Use still_relevant, may_have_changed, or insufficient_information. Never make the final engineering decision.',
      ].join('\n');
      const response = await client.reflect(bank, prompt, {
        budget: 'mid',
        responseSchema: REASSESSMENT_SCHEMA,
        includeFacts: true,
      });
      const output = structuredResponse(response, ['status', 'reason', 'challenged_assumptions', 'evidence_gaps']);
      if (!REASSESSMENT_SCHEMA.properties.status.enum.includes(output.status) ||
          typeof output.reason !== 'string' ||
          !Array.isArray(output.challenged_assumptions) ||
          !Array.isArray(output.evidence_gaps) ||
          [...output.challenged_assumptions, ...output.evidence_gaps].some((item) => typeof item !== 'string')) {
        throw new Error('Hindsight reassessment has an invalid structure');
      }
      return { decision_id: decision.id, changed_circumstances: changed, ...output, text: response.text };
    },
  };
}

export function createMemoryAiFromEnv(env = process.env) {
  const baseUrl = nonEmptyString(env.HINDSIGHT_BASE_URL, 'HINDSIGHT_BASE_URL');
  const bankId = nonEmptyString(env.HINDSIGHT_BANK_ID, 'HINDSIGHT_BANK_ID');
  const client = new HindsightClient({
    baseUrl,
    ...(env.HINDSIGHT_API_KEY ? { apiKey: env.HINDSIGHT_API_KEY } : {}),
  });
  return createMemoryAi({ client, bankId });
}
