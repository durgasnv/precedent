import { useState } from 'react'
import ProposalInput from '../components/ProposalInput'
import LoadingState from '../components/LoadingState'
import EmptyState from '../components/EmptyState'
import MemoryCard from '../components/MemoryCard'
import DecisionCard from '../components/DecisionCard'
import { getDecision } from '../mockData'

export default function Inbox({ proposal, setProposal, status, matches, analysis, noMatchReason, error, analyze, liveMode }) {
  const [selected, setSelected] = useState(null)

  const selectedId = matches.some((match) => match.decisionId === selected)
    ? selected
    : matches[0]?.decisionId ?? null
  const decision = selectedId ? getDecision(selectedId) : null
  const selectedMatch = matches.find((match) => match.decisionId === selectedId)

  return (
    <div className="stack">
      <ProposalInput value={proposal} onChange={setProposal} onAnalyze={analyze} loading={status === 'loading'} />

      {status === 'loading' && <LoadingState />}

      {status === 'error' && <section className="card error-state" role="alert"><h2>Analysis could not finish</h2><p>{error}</p><button className="btn" onClick={analyze}>Try again</button></section>}

      {status === 'done' && matches.length === 0 && (
        <EmptyState
          title="No related history found"
          body={noMatchReason || 'No related history was confirmed for this proposal.'}
        />
      )}

      {status === 'done' && matches.length > 0 && (
        <>
          <h2 className="section-title">{liveMode ? 'Historical memory' : 'Demo decision history'}</h2>
          <div className="memory-list">
            {matches.map((m) => (
              <MemoryCard
                key={m.decisionId}
                match={m}
                decision={getDecision(m.decisionId)}
                active={m.decisionId === selectedId}
                onOpen={setSelected}
              />
            ))}
          </div>
          {decision && <DecisionCard decision={decision} demo={!liveMode} />}
          {liveMode && selectedMatch?.facts?.length > 0 && (
            <section className="card evidence"><h2>Recalled evidence</h2><ul>{selectedMatch.facts.map((fact) => <li key={fact.id}><p>{fact.text}</p><small>Fact {fact.id}{fact.document_id ? ` · ${fact.document_id}` : ''}</small></li>)}</ul></section>
          )}
          {liveMode && analysis?.summary && <section className="ai-panel"><div className="ai-stamp">Current analysis</div><p>{analysis.summary}</p></section>}
        </>
      )}
    </div>
  )
}
