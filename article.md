# How Hindsight Helped Me Revisit a Failed WebSocket Migration

“We already tried WebSockets” can end an engineering discussion too early. I wanted the next engineer to see what failed, why it failed, and what would have to change before that result deserved another look.

The case that shaped PRECEDENT was a notification system. Polling generated needless requests, so replacing it with WebSockets looked attractive. An earlier migration had already run into unstable connections for enterprise customers: restrictive corporate proxies interrupted them. The recorded decision was to use Server-Sent Events instead. Later, “we tried WebSockets” would be easy to remember and dangerously incomplete. The proxy constraint was the useful part of the story.

I built PRECEDENT to preserve that distinction. It records the original technical decision, uses Hindsight to find related history when a new proposal arrives, and asks whether a changed circumstance challenges the assumptions behind the old result. The system reports evidence and uncertainty; an engineer still decides whether to run the experiment again.

## The record is bigger than a search result

A decision has several jobs to do. It must tell a future reader what problem we were solving, what we tried, what happened, what we decided, and why. It should also preserve alternatives and the conditions that would make us reconsider. For the WebSocket migration, the original assumption was that enterprise customers would continue using restrictive corporate proxies. That field changes the meaning of the outcome. Without it, an assistant could easily turn a contingent failure into a permanent rule.

PRECEDENT stores a canonical decision record separately from its searchable memory. The record owns the complete fields and stable ID. Hindsight holds facts extracted from the record, which are useful for recall but are not guaranteed to reconstruct the entire original document. This separation lets the interface show the exact historical record alongside the facts that prompted a match. It also gives reassessment a concrete original decision to compare against.

The memory write keeps that link explicit. This is the retention call in `src/memory-ai.js`:

```js
const result = await callHindsight('retain', () => client.retain(bank, formatDecision(decision), {
  documentId: `decision:${decision.id}`,
  context: 'PRECEDENT technical decision record',
  metadata: { decision_id: decision.id, title: decision.title },
  ...(decision.date && /^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(decision.date) ? { timestamp: decision.date } : {}),
  async: false,
}));
```

The document ID and metadata give us a route back to the canonical record. A repeated retain of the same decision uses the same document ID. The synchronous write is deliberate: after recording a decision, the next recall should be able to use it. I also include the decision date when it is a full date rather than inventing a day for a partial one.

Hindsight was useful here because I needed more than a longer prompt. The [Hindsight open-source repository](https://github.com/vectorize-io/hindsight) and [Hindsight documentation for retain, recall, and reflect](https://hindsight.vectorize.io/) describe a memory system that stores information between interactions, retrieves related facts, and reasons over them. The broader idea is [agent memory for applications with continuing context](https://vectorize.io/what-is-agent-memory): the next answer should be informed by prior events without relying on a developer to paste every previous decision into the request.

## A recalled fact is a candidate, not a verdict

The obvious implementation is to search for old decisions and put the first hit in a card labeled “precedent.” I rejected that behavior. Retrieval finds things worth checking; it does not establish that an old outcome applies to a new proposal. A database-index decision might be nearby in a broad query while having nothing useful to say about notification connections.

The first step is Hindsight Recall, with source facts requested:

```js
const response = await callHindsight('recall', () => client.recall(bank, query, {
  budget: 'mid',
  maxTokens: 4096,
  includeSourceFacts: true,
}));
```

The response is mapped into facts with IDs, text, source document IDs, decision IDs, and ranking scores. I treat those scores as query-local ranking signals, never as universal confidence percentages. The UI can show the text and fact IDs behind a historical match. An attractive percentage would be easier to scan, but it would imply a calibration we have not established.

Then Hindsight Reflect receives the new proposal and the recalled facts. I request structured fields: whether a relevant precedent exists, a reason when it does not, a summary, and matches naming specific recalled fact IDs. The prompt tells Reflect to separate recorded history from current interpretation, avoid inventing outcomes or assumptions, and leave the final decision to the engineer.

I still verify the references after generation. The model can only support a match with a fact the recall step actually returned:

```js
const allowedIds = new Set(memories.map(({ id }) => id));
const matches = output.matches.filter((match) =>
  match && allowedIds.has(match.memory_id) &&
  ['why_relevant', 'historical_outcome', 'original_assumption'].every((field) => typeof match[field] === 'string'));
```

This is a small check with an important consequence. If Reflect names an unknown memory ID, PRECEDENT discards that match. If Recall yields nothing, or Reflect decides that none of the candidates is relevant, the API returns a no-match reason and no accepted decision. It does not fill the empty space with a confident-sounding historical lesson.

I also group accepted facts by `decision_id`. One technical decision can produce several extracted facts: the attempted approach, the proxy failure, and the final choice of SSE may all be separate results. Grouping keeps one decision from appearing as three independent precedents, while retaining each supporting fact for inspection.

## Reassessment must leave history intact

Finding the old WebSocket failure is only half the job. Suppose a new proposal says enterprise customers now use network infrastructure without the former proxy restriction. The old record remains true: connections were unstable under the earlier conditions. The new statement may change the decision we would make today, but it cannot change what happened then.

PRECEDENT sends the canonical record and the new circumstance to Hindsight Reflect for a separate reassessment. The structured result has one of three statuses: `still_relevant`, `may_have_changed`, or `insufficient_information`. It also names challenged assumptions and evidence gaps. The distinction matters. “The proxy restriction is gone” is an input from an engineer; it is not, by itself, proof that WebSocket connections now work reliably for every enterprise customer.

The orchestration code reflects that separation. It saves a timeline event after the reassessment returns, without rewriting the decision:

```js
const reassessmentResult = await aiMemoryService.reassessAssumptions({
  decisionId: payload.decisionId || null,
  decisionRecord: targetDecision,
  collectionId: payload.collectionId,
  proposal: payload.proposal || null,
  changedCircumstances: payload.changedCircumstances
});

decisionModel.addReassessment(payload.decisionId, payload.collectionId, payload.changedCircumstances, reassessmentResult);
```

The history has two kinds of material: the recorded decision and a later generated assessment. I label them separately in the interface. The assessment is not automatically retained as a new historical fact. If the team reruns the experiment, its measured outcome should be recorded as a new observation with its own evidence, not inferred from the model's recommendation.

Collections provide a second boundary. PRECEDENT can hold unrelated technical examples, but a proposal in one collection should not recall decisions from another. The API checks the selected collection for record access, and the memory service gives each collection its own Hindsight bank. A bank boundary is a way to keep examples and evidence scoped; it is not a substitute for user authentication.

## What I can observe from the workflow

The WebSocket record says the attempted approach was to replace polling, that enterprise connections became unstable, and that corporate proxies were the failure reason. When the proposal asks whether notifications should move from SSE to WebSockets, recall finds the related decision. Structured analysis accepts source-backed facts from that decision rather than merely presenting a search hit. When I supplied the changed proxy circumstance to Hindsight, reassessment returned `may_have_changed`—a prompt to validate the new network path, not a declaration that the migration will succeed.

An unrelated office-supplies proposal is a useful counterexample. Recall can still return candidate facts, but the relevance step accepts no decision match. That behavior is as important as finding the WebSocket record: a memory system that always offers an analogy can make an engineer less informed than one that admits it has no useful history.

I do not have a latency or accuracy benchmark for this workload, so I will not invent one. The observable contract is narrower and testable: decision records retain their IDs and context, matches cite recalled facts, unrelated candidates can be rejected, and reassessment preserves the old outcome while describing what may have changed.

## What I learned

First, store assumptions alongside outcomes. “WebSockets failed” is easy to retrieve and easy to misuse. “WebSockets failed for enterprise customers behind restrictive proxies” gives the next engineer a condition to test.

Second, keep the canonical record and the memory index linked but distinct. Hindsight is strong at extracting and recalling related facts. The application still needs an authoritative record for full context, dates, references, and later history. The stable `decision_id` connects those roles.

Third, make retrieval earn its place in the answer. I ask Hindsight to recall candidates and reason about relevance, then check that cited IDs were actually returned. Empty or unrelated memory should stay empty in the result.

Fourth, treat a changed assumption as a question for another experiment. The old decision remains part of the record. The new assessment can identify gaps, but a measured result is the thing that should update what the organization knows. That is the difference between remembering a failure and learning from it.
