import { useEffect, useState } from 'react'
import ProposalInput from '../components/ProposalInput'
import LoadingState from '../components/LoadingState'
import EmptyState from '../components/EmptyState'
import MemoryCard from '../components/MemoryCard'
import DecisionCard from '../components/DecisionCard'
import AssumptionCheck from '../components/AssumptionCheck'
import { getDecision, assumptionChecks } from '../mockData'

export default function Inbox({ proposal, setProposal, status, matches, analyze }) {
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    setSelected(matches[0]?.decisionId ?? null)
  }, [matches])

  const decision = selected ? getDecision(selected) : null

  return (
    <div className="stack">
      <ProposalInput value={proposal} onChange={setProposal} onAnalyze={analyze} loading={status === 'loading'} />

      {status === 'loading' && <LoadingState />}

      {status === 'done' && matches.length === 0 && (
        <EmptyState
          title="No related history found"
          body="Nothing in memory looks like this proposal. Try naming the technology or the problem it solves."
        />
      )}

      {status === 'done' && decision && (
        <>
          <h2 className="section-title">Historical memory</h2>
          <div className="memory-list">
            {matches.map((m) => (
              <MemoryCard
                key={m.decisionId}
                match={m}
                decision={getDecision(m.decisionId)}
                active={m.decisionId === selected}
                onOpen={setSelected}
              />
            ))}
          </div>
          <DecisionCard decision={decision} />
          <h2 className="section-title">Reassessment</h2>
          <AssumptionCheck check={assumptionChecks[decision.id]} />
        </>
      )}
    </div>
  )
}