# Requirements — PRECEDENT

## 1. Product Requirement
PRECEDENT must preserve institutional knowledge about technical experiments and decisions so that teams can detect when a proposed approach resembles something previously attempted.

## 2. Functional Requirements

### FR-1 — Record a Technical Decision
The user must be able to record:
- title
- problem/goal
- attempted approach
- outcome
- failure reason
- alternatives
- final decision
- assumptions/blockers
- conditions under which the idea should be reconsidered
- optional evidence/reference

### FR-2 — Persist Memory
The backend must retain meaningful decision context in Hindsight.

### FR-3 — Recall Related History
Given a new proposal, the system must retrieve relevant historical memories rather than rely only on the current prompt.

### FR-4 — Explain the Match
For each useful recalled memory, show:
- what was previously attempted
- why it is relevant
- what happened
- why it failed/succeeded
- what decision followed

### FR-5 — Reassess Changed Assumptions
The user must be able to provide new circumstances. The system should compare them with the assumptions behind the historical decision.

Possible result categories:
- original blocker still appears relevant
- original blocker may have changed
- insufficient information to determine

### FR-6 — Human Decision Control
The system must provide evidence and reasoning but must not silently execute engineering decisions.

### FR-7 — Memory Visibility
The UI must visibly demonstrate that historical memory affected the answer.

## 3. Demo Requirements
The demo must clearly show:
1. a response without useful historical context,
2. retention of a real decision/experiment,
3. later recall of that experiment,
4. behavior that changes because of the recalled memory,
5. reassessment after circumstances change.

## 4. UX Requirements
- New proposal entry should take seconds.
- Historical matches should be scannable.
- Failure reason and original assumptions should be visually prominent.
- Recalled memory must be distinguishable from generated analysis.
- The demo path should work without explaining the interface.

## 5. Technical Requirements
- React frontend.
- Node.js/Express backend.
- Hindsight as the persistent agent-memory layer.
- One supported LLM with structured response generation.
- Environment variables for credentials/configuration.
- Input validation.
- Graceful API and Hindsight failure states.
- Seed script or fixture data for a reliable demo.

## 6. Memory Requirements
Memory records should preserve enough context to answer:
- What were we trying to do?
- What did we try?
- What happened?
- Why?
- What did we decide?
- What assumptions caused that decision?
- What would have to change to reconsider it?

## 7. Non-Functional Requirements
### Reliability
The golden demo must be repeatable.

### Explainability
Do not return “we tried this before” without showing supporting memory.

### Performance
Target an interactive response time suitable for a live demo.

### Maintainability
Keep frontend, API, memory service, and LLM reasoning separated into straightforward modules.

### Security
Secrets must remain server-side and outside version control.

## 8. Hackathon Alignment
The project should visibly demonstrate:
- persistent memory,
- recall of earlier interactions/knowledge,
- improvement in usefulness as memory accumulates,
- a professional real-world workflow,
- a clear before/after story,
- clean implementation and intuitive UX.

## 9. Submission Requirements
Prepare:
- clean documented GitHub repository,
- live demo,
- demo video,
- explanation of Hindsight usage,
- required article/social content,
- screenshots/architecture visual.

## 10. Acceptance Criteria
The MVP is complete when:
- [ ] a decision can be recorded;
- [ ] it is retained through Hindsight;
- [ ] a later proposal retrieves the correct historical context;
- [ ] the UI shows why that memory is relevant;
- [ ] changed circumstances can trigger an assumption reassessment;
- [ ] the end-to-end golden demo works reliably;
- [ ] README and submission material explain the memory flow.
