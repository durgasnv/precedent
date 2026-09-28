import { useState } from 'react'
import MemoryCard from '../components/MemoryCard'
import DecisionCard from '../components/DecisionCard'
import LiveDecisionCard from '../components/LiveDecisionCard'
import EmptyState from '../components/EmptyState'
import { getDecision } from '../mockData'

export default function MemoryMatch({ matches, status, noMatchReason, error, analysis, liveMode, onNavigate, collectionId }) {
  const [open, setOpen] = useState(null)

  if (matches.length === 0) {
    return (
      <EmptyState
        title={status === 'done' ? 'No related history found' : status === 'error' ? 'Analysis could not finish' : 'No proposal analyzed yet'}
        body={status === 'done' ? noMatchReason : status === 'error' ? error : 'Analyze a proposal in the Decision Inbox to see related experiments here.'}
        actionLabel="Go to Decision Inbox"
        onAction={() => onNavigate('inbox')}
      />
    )
  }

  const selectedId = matches.some((match) => match.decisionId === open) ? open : matches[0].decisionId
  const decision = getDecision(selectedId)
  const selectedMatch = matches.find((match) => match.decisionId === selectedId)
  return (
    <div className="stack">
      <div className="memory-list">
        {matches.map((m) => (
          <MemoryCard
            key={m.decisionId}
            match={m}
            decision={liveMode ? null : getDecision(m.decisionId)}
            active={selectedId === m.decisionId}
            onOpen={setOpen}
          />
        ))}
      </div>
      {liveMode ? <LiveDecisionCard key={selectedId} id={selectedId} collectionId={collectionId} /> : decision && <DecisionCard decision={decision} />}
      {liveMode && selectedMatch?.facts?.length > 0 && <section className="card evidence"><h2>Recalled evidence</h2><ul>{selectedMatch.facts.map((fact) => <li key={fact.id}><p>{fact.text}</p><small>Fact {fact.id}{fact.document_id ? ` · ${fact.document_id}` : ''}</small></li>)}</ul></section>}
      {liveMode && analysis?.summary && <section className="ai-panel"><div className="ai-stamp">Current analysis</div><p>{analysis.summary}</p></section>}
    </div>
  )
}
