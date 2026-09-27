import { HindsightClient, HindsightError } from '@vectorize-io/hindsight-client';

export class MemoryAiError extends Error {
  constructor(code, stage, message, options = {}) {
    super(message, { cause: options.cause });
    this.name = 'MemoryAiError';
    this.code = code;
    this.stage = stage;
    this.retryable = options.retryable ?? false;
  }
}

async function callHindsight(stage, operation) {
  try {
    return await operation();
  } catch (cause) {
    if (cause instanceof MemoryAiError) throw cause;
    const status = cause instanceof HindsightError ? cause.statusCode : undefined;
    if (status === 401 || status === 403) {
      throw new MemoryAiError('HINDSIGHT_AUTH', stage, 'Hindsight authentication or permission failed.', { cause });
    }
    if (status === 402) {
      throw new MemoryAiError('HINDSIGHT_CREDITS', stage, 'Hindsight credits are unavailable.', { cause });
    }
    if (status === 429 || status >= 500 || cause?.name === 'AbortError' || cause instanceof TypeError) {
      throw new MemoryAiError('HINDSIGHT_UNAVAILABLE', stage, 'Hindsight is temporarily unavailable.', { cause, retryable: true });
    }
    throw new MemoryAiError('HINDSIGHT_REQUEST_FAILED', stage, 'Hindsight rejected the request.', { cause });
  }
}

const ANALYSIS_SCHEMA = {
  type: 'object',
  properties: {
    has_relevant_precedent: { type: 'boolean' },
    no_match_reason: { type: 'string' },
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
  required: ['has_relevant_precedent', 'no_match_reason', 'summary', 'matches'],
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
  if (!Array.isArray(response?.results)) {
    throw new MemoryAiError('HINDSIGHT_INVALID_RESPONSE', 'recall', 'Hindsight recall returned an invalid response.');
  }
  return response.results.map((item) => {
    if (typeof item?.id !== 'string' || !item.id || typeof item.text !== 'string') {
      throw new MemoryAiError('HINDSIGHT_INVALID_RESPONSE', 'recall', 'Hindsight recall returned an invalid fact.');
    }
    return {
      id: item.id,
      text: item.text,
      type: item.type,
      document_id: item.document_id ?? null,
      decision_id: item.metadata?.decision_id ?? (item.document_id?.startsWith('decision:') ? item.document_id.slice('decision:'.length) : null),
      title: item.metadata?.title ?? null,
      source_fact_ids: item.source_fact_ids ?? [],
      source_facts: (item.source_fact_ids ?? []).map((id) => response.source_facts?.[id]).filter(Boolean).map((source) => ({
        id: source.id,
        text: source.text,
        document_id: source.document_id ?? null,
        decision_id: source.metadata?.decision_id ?? null,
      })),
      scores: item.scores ?? null,
    };
  });
}

export function groupDecisionMatches(memories, matches) {
  const byId = new Map();
  const memoryById = new Map(memories.map((memory) => [memory.id, memory]));
  for (const match of matches) {
    const memory = memoryById.get(match.memory_id);
    if (!memory?.decision_id) continue;
    let group = byId.get(memory.decision_id);
    if (!group) {
      group = { decision_id: memory.decision_id, title: memory.title, facts: [], matches: [] };
      byId.set(memory.decision_id, group);
    }
    if (!group.facts.some((fact) => fact.id === memory.id)) group.facts.push(memory);
    group.matches.push(match);
  }
  return [...byId.values()];
}

function structuredResponse(response, requiredFields, stage) {
  const output = response?.structured_output;
  if (!output || typeof output !== 'object' || Array.isArray(output) ||
      requiredFields.some((field) => !(field in output))) {
    throw new MemoryAiError('HINDSIGHT_INVALID_RESPONSE', stage, 'Hindsight reflect did not return valid structured output.', {
      retryable: Boolean(response?.structured_output_error),
    });
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
    const response = await callHindsight('recall', () => client.recall(bank, query, {
      budget: 'mid',
      maxTokens: 4096,
      includeSourceFacts: true,
    }));
    return recalledMemories(response);
  };

  return {
    async setupBank() {
      return callHindsight('setup', () => client.createBank(bank, {
        name: 'PRECEDENT technical decisions',
        retainMission: 'Extract technical goals, attempted approaches, outcomes, causes, final decisions, assumptions, and conditions for reconsideration. Preserve uncertainty and source context.',
        reflectMission: 'Help engineers understand prior technical decisions. Distinguish recorded history from current analysis, cite evidence, and leave final decisions to humans.',
      }));
    },

    async retainDecision(input) {
      const decision = validateDecision(input);
      const result = await callHindsight('retain', () => client.retain(bank, formatDecision(decision), {
        documentId: `decision:${decision.id}`,
        context: 'PRECEDENT technical decision record',
        metadata: { decision_id: decision.id, title: decision.title },
        ...(decision.date && /^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(decision.date) ? { timestamp: decision.date } : {}),
        async: false,
      }));
      return { decision_id: decision.id, document_id: `decision:${decision.id}`, result };
    },

    recallRelated,

    async analyzeProposal(proposal) {
      const query = nonEmptyString(proposal, 'proposal');
      const memories = await recallRelated(query);
      if (memories.length === 0) {
        return { proposal: query, memories, decision_matches: [], analysis: null, no_match_reason: 'No decision memories were recalled.' };
      }
      const evidence = memories.map(({ id, text, decision_id }) => ({ id, text, decision_id }));
      const prompt = [
        'Analyze this new technical proposal against the recorded technical decisions.',
        `Proposal: ${query}`,
        `Recalled evidence: ${JSON.stringify(evidence)}`,
        'Decide whether any recalled evidence is genuinely relevant to the proposed approach. Retrieval rank alone is not proof of relevance.',
        'If no evidence is relevant, set has_relevant_precedent to false, give a short no_match_reason, and return no matches.',
        'If there is a relevant precedent, set has_relevant_precedent to true and explain why each useful memory relates to the proposal. Use only memory_id values from the recalled evidence.',
        'Separate historical facts from your current interpretation. Do not invent outcomes or assumptions. If unknown, say so.',
        'An old failure is not a permanent prohibition. The engineer makes the final decision.',
      ].join('\n');
      const response = await callHindsight('analyze', () => client.reflect(bank, prompt, {
        budget: 'mid',
        responseSchema: ANALYSIS_SCHEMA,
        includeFacts: true,
      }));
      const output = structuredResponse(response, ['has_relevant_precedent', 'no_match_reason', 'summary', 'matches'], 'analyze');
      if (typeof output.has_relevant_precedent !== 'boolean' || typeof output.no_match_reason !== 'string' ||
          typeof output.summary !== 'string' || !Array.isArray(output.matches)) {
        throw new MemoryAiError('HINDSIGHT_INVALID_RESPONSE', 'analyze', 'Hindsight analysis has an invalid structure.');
      }
      const allowedIds = new Set(memories.map(({ id }) => id));
      const matches = output.matches.filter((match) =>
        match && allowedIds.has(match.memory_id) &&
        ['why_relevant', 'historical_outcome', 'original_assumption'].every((field) => typeof match[field] === 'string'));
      if (!output.has_relevant_precedent || matches.length === 0) {
        return {
          proposal: query, memories, decision_matches: [], analysis: null,
          no_match_reason: output.no_match_reason || 'No recalled memory was confirmed as relevant.',
        };
      }
      return {
        proposal: query,
        memories,
        decision_matches: groupDecisionMatches(memories, matches),
        analysis: { summary: output.summary, matches, text: response.text },
        no_match_reason: null,
      };
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
      const response = await callHindsight('reassess', () => client.reflect(bank, prompt, {
        budget: 'mid',
        responseSchema: REASSESSMENT_SCHEMA,
        includeFacts: true,
      }));
      const output = structuredResponse(response, ['status', 'reason', 'challenged_assumptions', 'evidence_gaps'], 'reassess');
      if (!REASSESSMENT_SCHEMA.properties.status.enum.includes(output.status) ||
          typeof output.reason !== 'string' ||
          !Array.isArray(output.challenged_assumptions) ||
          !Array.isArray(output.evidence_gaps) ||
          [...output.challenged_assumptions, ...output.evidence_gaps].some((item) => typeof item !== 'string')) {
        throw new MemoryAiError('HINDSIGHT_INVALID_RESPONSE', 'reassess', 'Hindsight reassessment has an invalid structure.');
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
