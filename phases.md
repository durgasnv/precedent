# Build Phases — PRECEDENT

**Team:** 3 people<br>
**Deadline:** September 29, 2026<br>
**Rule:** Freeze feature scope once the golden path works.

## Phase 0 — Lock the Product
**Target: Sept 27, first 30–45 min**

- Confirm name and one-line pitch.
- Create repository and branches.
- Agree on API contracts.
- Agree on the decision-memory schema.
- Pick one LLM.
- Prepare 3–5 realistic engineering decision records.

**Exit:** Everyone can explain the same golden demo.

---

## Phase 1 — Skeleton in Parallel
**Target: Sept 27**

### Memory/AI
- Connect to Hindsight.
- Prove retain.
- Prove recall.
- Define structured prompts/results.

### Backend
- Express server.
- health route.
- decision/analyze/reassess routes.
- service boundaries and validation.

### Frontend
- React shell.
- proposal input.
- memory-result card.
- decision detail/assumption panel.

**Exit:** Frontend can call backend; backend can call Hindsight.

---

## Phase 2 — Core Memory Loop
**Target: Sept 27 night**

Implement:

```text
Record attempt
   ↓
Retain in Hindsight
   ↓
Submit new proposal
   ↓
Recall related memory
   ↓
LLM explains precedent
   ↓
UI shows evidence
```

Do not work on secondary features until this works.

**Exit:** First complete before/after demo.

---

## Phase 3 — Assumption Reassessment
**Target: Sept 28 morning**

Implement the differentiating feature:

```text
Historical failure
       ↓
Original blocker
       ↓
New circumstance
       ↓
Compare assumptions
   /         |          \
still     changed     unclear
```

Requirements:
- preserve historical decision;
- never rewrite history;
- generate a separate current reassessment;
- show which assumption is being challenged.

**Exit:** Full “we tried this before — but circumstances changed” demo works.

---

## Phase 4 — Demo UX + Reliability
**Target: Sept 28 afternoon**

- Polish memory cards.
- Add timeline/history.
- Clearly label “Historical Memory” vs “Current Analysis.”
- Add loading/error/empty states.
- Seed deterministic realistic data.
- Test demo repeatedly.
- Handle no-match scenario.
- Handle ambiguous-memory scenario.

**Exit:** Someone outside the team understands the product in <60 seconds.

---

## Phase 5 — Documentation + Deployment
**Target: Sept 28 evening**

- README.
- architecture diagram.
- Hindsight integration explanation.
- setup instructions.
- environment variable example.
- screenshots.
- deploy frontend/backend.
- test clean install.

**Exit:** Public repository and live demo are usable.

---

## Phase 6 — Submission Content
**Target: Sept 28 night / Sept 29**

- Article draft and screenshots.
- Each member prepares their required social/article contribution.
- Record the team demo video.
- Show retain/recall in the recording.
- Prepare thumbnail.
- Publish required public links.
- Verify repository/demo/video/content URLs.

**Exit:** Submission checklist complete.

---

## Phase 7 — Sept 29 Buffer
Only:
- critical bug fixes,
- deployment failures,
- broken links,
- content/submission fixes.

**No new features.**

## If We Fall Behind
Cut in this order:
1. elaborate timeline visualization;
2. filters/search;
3. multiple project workspaces;
4. fancy animations;
5. extra seeded scenarios.

Never cut:
1. Hindsight retain;
2. Hindsight recall;
3. evidence-backed historical match;
4. changed-assumption reassessment;
5. reliable golden demo.
