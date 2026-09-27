# Project Plan — PRECEDENT

## Product
**PRECEDENT** is an institutional-memory agent for technical decisions and failed engineering experiments.

**Core promise:** Before a team repeats an old idea, PRECEDENT finds related past attempts, explains why they failed, and helps determine whether the assumptions behind the old decision still apply.

## Problem
Engineering teams lose decision context across employee turnover, ownership changes, chat threads, tickets, pull requests, and meetings. The result is repeated experiments, repeated mistakes, and time spent rediscovering why a decision was made.

## MVP Goal
Build one polished workflow:

1. Record a technical experiment/decision.
2. Store the attempt, outcome, failure reason, decision, and assumptions as persistent memory.
3. Accept a new proposal from a developer.
4. Recall semantically related historical attempts.
5. Explain the relevant precedent.
6. Let the user provide changed circumstances.
7. Re-evaluate whether the original blocker still applies.

## Golden Demo
### Historical memory
A team previously tried WebSockets for notifications.
- Goal: reduce polling overhead.
- Result: unstable connections for enterprise customers.
- Cause: corporate proxies.
- Alternative: Server-Sent Events.
- Decision: remain on SSE.
- Reconsider when: network/proxy constraints change.

### New proposal
User: “Let’s move notifications to WebSockets.”

PRECEDENT surfaces the previous attempt and explains the blocker.

User: “Those customers are now routed through infrastructure that removes the proxy limitation.”

PRECEDENT compares the new context against the original assumptions and identifies the decision as worth re-evaluating.

## Product Principles
- Memory must drive the result, not decorate an ordinary chatbot.
- Show evidence for recalled decisions.
- Never treat an old failure as permanently invalid.
- Separate historical facts from current AI reasoning.
- Keep humans responsible for final technical decisions.
- Optimize for one memorable workflow rather than feature breadth.

## MVP Screens
### 1. Decision Inbox
Submit a new proposal or question.

### 2. Memory Match
Show related past experiments:
- similarity/relevance
- date
- original goal
- outcome
- failure reason
- decision

### 3. Decision Record
Structured view of one historical attempt.

### 4. Assumption Check
Compare:
- original blocker/assumption
- current circumstances
- status: still relevant / potentially changed / insufficient evidence

### 5. Memory Timeline
Simple chronological view of retained technical decisions.

## Architecture
```text
React Frontend
      |
      v
Node/Express API
      |
      +------> LLM reasoning
      |
      +------> Hindsight memory
                    |
              retain / recall
```

## Suggested Data Shape
```json
{
  "title": "WebSocket notification migration",
  "problem": "Reduce polling overhead",
  "approach": "Replace polling with WebSockets",
  "outcome": "Failed for enterprise customers",
  "failure_reason": "Corporate proxies caused unstable connections",
  "alternatives": ["Server-Sent Events"],
  "decision": "Remain on SSE",
  "assumptions": [
    "Enterprise customers continue to use restrictive corporate proxies"
  ],
  "reconsider_when": [
    "Network/proxy constraints materially change"
  ],
  "evidence": ["incident/decision reference"],
  "date": "2026-04"
}
```

## API Surface
- `POST /api/decisions` — record a decision/experiment.
- `POST /api/analyze` — analyze a new proposal against memory.
- `POST /api/reassess` — reassess a historical decision with changed context.
- `GET /api/decisions` — list decision memories.
- `GET /api/decisions/:id` — inspect one record.

## Team of 3
### Member 1 — Memory + AI
- Hindsight integration
- retain/recall
- prompts and structured outputs
- assumption comparison

### Member 2 — Backend
- Express API
- validation
- decision model
- LLM/Hindsight orchestration
- error handling

### Member 3 — Frontend + Demo
- React interface
- memory cards/timeline
- assumption-check UI
- loading/error states
- demo polish

## Explicitly Out of Scope
- Authentication
- multi-tenant organizations
- GitHub/Slack/Jira OAuth
- automatic code changes
- multi-agent orchestration
- complex analytics
- production-grade RBAC

These are post-MVP opportunities, not deadline work.
