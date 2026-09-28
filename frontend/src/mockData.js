// The frontend demo uses the same decision records as the Hindsight seed script.
// Presentation details and prepared reassessments stay here until API routes exist.
import { demoDecisions } from '../../fixtures/demo-decisions'

const presentation = {
  'demo-websocket-notifications': {
    date: '2026-04-12',
    team: 'Platform',
    tags: ['websocket', 'websockets', 'notifications', 'polling', 'sse', 'proxy'],
    relevanceNote: 'The earlier notification migration tested the same connection approach and hit a proxy constraint.',
  },
  'demo-postgres-index': {
    date: '2026-05-08',
    team: 'Data',
    tags: ['postgres', 'postgresql', 'index', 'orders', 'database', 'query'],
    relevanceNote: 'The team already measured a partial index for the active-order query.',
  },
  'demo-redis-cache': {
    date: '2026-06-19',
    team: 'Security',
    tags: ['redis', 'cache', 'permissions', 'revocation', 'invalidation'],
    relevanceNote: 'A ten-minute permissions cache was tried and delayed revocations.',
  },
}

export const decisions = demoDecisions.map((record) => ({
  ...record,
  ...presentation[record.id],
  failureReason: record.failure_reason || 'No failure recorded; the experiment succeeded.',
  reconsiderWhen: record.reconsider_when,
}))

export const assumptionChecks = {
  'demo-websocket-notifications': {
    newCircumstance: 'Enterprise customers now use infrastructure without the former proxy restriction.',
    rows: [
      { assumption: decisions[0].assumptions[0], now: 'The reported network change may remove the blocker; connection tests are still needed.', status: 'changed' },
    ],
    verdict: 'The previous proxy blocker may have changed. Verify enterprise connection reliability before deciding whether to migrate.',
  },
  'demo-postgres-index': {
    newCircumstance: 'The share of active orders has grown substantially.',
    rows: [
      { assumption: decisions[1].assumptions[0], now: 'The original data distribution may no longer hold.', status: 'unknown' },
      { assumption: decisions[1].assumptions[1], now: 'The active-order query still uses the same predicate.', status: 'holds' },
    ],
    verdict: 'The index succeeded previously, but the current data distribution should be benchmarked again.',
  },
  'demo-redis-cache': {
    newCircumstance: 'Reliable event-driven invalidation has been added for permission changes.',
    rows: [
      { assumption: decisions[2].assumptions[0], now: 'The one-minute requirement still holds; the new invalidation path must meet it.', status: 'holds' },
    ],
    verdict: 'The old revocation blocker may be addressable. Measure invalidation latency before enabling the cache.',
  },
}

export const timelineEvents = [
  { id: 't1', date: '2026-04-12', type: 'Failed', title: 'WebSocket notification migration hit corporate proxies', decisionId: decisions[0].id },
  { id: 't2', date: '2026-04-13', type: 'Decided', title: 'Notifications stayed on Server-Sent Events', decisionId: decisions[0].id },
  { id: 't3', date: '2026-05-08', type: 'Decided', title: 'Partial index improved active-order queries', decisionId: decisions[1].id },
  { id: 't4', date: '2026-06-19', type: 'Failed', title: 'Redis permissions cache delayed revocations', decisionId: decisions[2].id },
  { id: 't5', date: '2026-06-20', type: 'Decided', title: 'Permissions cache waits for event invalidation', decisionId: decisions[2].id },
]

// Local keyword matching demonstrates the UI; the backend will supply real recall.
export function findMatches(text) {
  const query = text.toLowerCase()
  return decisions
    .map((decision) => ({ decision, hits: decision.tags.filter((tag) => query.includes(tag)).length }))
    .filter(({ hits }) => hits > 0)
    .sort((a, b) => b.hits - a.hits)
    .map(({ decision }) => ({ decisionId: decision.id, why: decision.relevanceNote }))
}

export const getDecision = (id) => decisions.find((decision) => decision.id === id)
