import { useState } from 'react'
import MemoryCard from '../components/MemoryCard'
import DecisionCard from '../components/DecisionCard'
import EmptyState from '../components/EmptyState'
import { getDecision } from '../mockData'

export default function MemoryMatch({ matches, onNavigate }) {
  const [open, setOpen] = useState(null)

  if (matches.length === 0) {
    return (
      <EmptyState
        title="No proposal analyzed yet"
        body="Analyze a proposal in the Decision Inbox to see related experiments here."
        actionLabel="Go to Decision Inbox"
        onAction={() => onNavigate('inbox')}
      />
    )
  }

  const decision = getDecision(open ?? matches[0].decisionId)
  return (
    <div className="stack">
      <div className="memory-list">
        {matches.map((m) => (
          <MemoryCard
            key={m.decisionId}
            match={m}
            decision={getDecision(m.decisionId)}
            active={decision.id === m.decisionId}
            onOpen={setOpen}
          />
        ))}
      </div>
      <DecisionCard decision={decision} />
    </div>
  )
}