// Demo data so the frontend works before the backend is connected.

export const decisions = [
  {
    id: 'd-ws-2024',
    title: 'WebSocket for the live ops dashboard',
    date: '2024-03-14',
    team: 'Platform',
    tags: ['websocket', 'socket', 'realtime', 'real-time', 'live', 'push', 'polling', 'dashboard'],
    problem: 'The ops dashboard polled every 5 seconds and felt stale during incidents.',
    approach: 'Replaced polling with a WebSocket connection per browser tab, served through the existing API gateway.',
    outcome: 'Rolled back after 9 days. Connections dropped in bursts once concurrency passed about 1,200.',
    failureReason:
      'The load balancer closed idle connections after 60 seconds, corporate proxies stripped the Upgrade header for some customers, and the gateway kept connection state in memory and leaked under reconnect storms.',
    alternatives: ['Server-Sent Events', 'Long polling', 'Managed pub/sub service'],
    decision: 'Keep 5-second polling and add ETag caching to cut cost.',
    assumptions: [
      'The load balancer cannot hold long-lived connections past 60 seconds idle.',
      'The gateway cannot share connection state across instances.',
      'Customer proxies will keep blocking WebSocket upgrades.',
    ],
    reconsiderWhen: [
      'Infrastructure moves to a gateway with native WebSocket support.',
      'Polling cost exceeds the budget for real-time features.',
    ],
    relevanceNote: 'Your proposal also replaces polling with a persistent connection through the same gateway.',
  },
  {
    id: 'd-billing-2023',
    title: 'Split billing into microservices',
    date: '2023-09-02',
    team: 'Payments',
    tags: ['microservice', 'microservices', 'billing', 'split', 'service', 'distributed'],
    problem: 'Billing deploys were blocked by unrelated changes in the monolith.',
    approach: 'Extracted invoicing, payments and ledger into three services with separate databases.',
    outcome: 'Stopped after two quarters. Incidents doubled and on-call load became unsustainable.',
    failureReason:
      'Invoice and ledger writes needed distributed transactions. Partial failures left accounts inconsistent and took days to reconcile.',
    alternatives: ['Modular monolith', 'Single extracted payments service'],
    decision: 'Move to a modular monolith with enforced module boundaries.',
    assumptions: [
      'The team cannot operate distributed transactions safely.',
      'Deploy contention can be solved inside one codebase.',
    ],
    reconsiderWhen: ['A dedicated platform team owns service tooling.', 'Ledger writes become idempotent by design.'],
    relevanceNote: 'Splitting a tightly coupled domain into services hit the same consistency limits.',
  },
  {
    id: 'd-cache-2024',
    title: 'Redis cache in front of search',
    date: '2024-08-21',
    team: 'Search',
    tags: ['redis', 'cache', 'caching', 'search', 'latency', 'stale'],
    problem: 'Search p95 latency exceeded 1.4 seconds at peak.',
    approach: 'Cached full result pages in Redis for 10 minutes, keyed by query.',
    outcome: 'Latency improved 40 percent, but users saw stale inventory and support tickets rose.',
    failureReason: 'Invalidation was manual. Inventory changes did not reach cached pages, so results were wrong for up to 10 minutes.',
    alternatives: ['Database read replica', 'Per-item cache with event invalidation'],
    decision: 'Use a read replica now; revisit per-item caching once change events exist.',
    assumptions: ['No reliable inventory change events exist.', 'Stale results cost more than slow results.'],
    reconsiderWhen: ['Inventory service publishes change events.'],
    relevanceNote: 'Caching for speed traded away correctness in a similar way.',
  },
]

export const assumptionChecks = {
  'd-ws-2024': {
    newCircumstance: 'The platform team migrated to a managed gateway last month with native WebSocket support and a 1-hour idle timeout.',
    rows: [
      { assumption: decisions[0].assumptions[0], now: 'Managed gateway allows 1-hour idle connections.', status: 'changed' },
      { assumption: decisions[0].assumptions[1], now: 'Gateway keeps connection state outside the process, so scaling out is supported.', status: 'changed' },
      { assumption: decisions[0].assumptions[2], now: 'No new data. Ask support which customers still sit behind restrictive proxies.', status: 'unknown' },
    ],
    verdict: 'Two of three blockers no longer apply. Worth a limited pilot with an SSE fallback for customers behind proxies.',
  },
  'd-billing-2023': {
    newCircumstance: 'A platform team now owns service tooling, and the ledger uses idempotency keys.',
    rows: [
      { assumption: decisions[1].assumptions[0], now: 'Idempotent ledger writes reduce the need for distributed transactions.', status: 'changed' },
      { assumption: decisions[1].assumptions[1], now: 'Module boundaries are enforced and deploys are smoother.', status: 'holds' },
    ],
    verdict: 'The original blocker has weakened, but the current design already solves the deploy problem. Low urgency.',
  },
  'd-cache-2024': {
    newCircumstance: 'The inventory service started publishing change events in July.',
    rows: [
      { assumption: decisions[2].assumptions[0], now: 'Change events are now published for every inventory update.', status: 'changed' },
      { assumption: decisions[2].assumptions[1], now: 'Support data still shows wrong results cost more.', status: 'holds' },
    ],
    verdict: 'Event-driven per-item invalidation is now possible. Reopen the caching proposal.',
  },
}

export const timelineEvents = [
  { id: 't1', date: '2023-09-02', type: 'Started', title: 'Billing split into three services', decisionId: 'd-billing-2023' },
  { id: 't2', date: '2024-02-19', type: 'Decided', title: 'Billing moved to a modular monolith', decisionId: 'd-billing-2023' },
  { id: 't3', date: '2024-03-14', type: 'Started', title: 'WebSocket rollout to the ops dashboard', decisionId: 'd-ws-2024' },
  { id: 't4', date: '2024-03-23', type: 'Failed', title: 'WebSocket rolled back after connection drops', decisionId: 'd-ws-2024' },
  { id: 't5', date: '2024-03-28', type: 'Decided', title: 'Keep polling, add ETag caching', decisionId: 'd-ws-2024' },
  { id: 't6', date: '2024-08-21', type: 'Started', title: 'Redis page cache added to search', decisionId: 'd-cache-2024' },
  { id: 't7', date: '2024-09-30', type: 'Decided', title: 'Search moved to a read replica', decisionId: 'd-cache-2024' },
]

// Simple keyword match standing in for the real memory search.
export function findMatches(text) {
  const t = text.toLowerCase()
  return decisions
    .map((d) => ({ d, hits: d.tags.filter((tag) => t.includes(tag)).length }))
    .filter((x) => x.hits > 0)
    .sort((a, b) => b.hits - a.hits)
    .map(({ d, hits }) => ({
      decisionId: d.id,
      relevance: Math.min(96, 52 + hits * 14),
      why: d.relevanceNote,
    }))
}

export const getDecision = (id) => decisions.find((d) => d.id === id)