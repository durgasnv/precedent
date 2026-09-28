export default function MemoryCard({ match, decision, active, onOpen }) {
  return (
    <button className={`record memory-card ${active ? 'is-active' : ''}`} onClick={() => onOpen?.(match.decisionId)}>
      <div className="memory-top">
        <h3>{decision?.title || match.title || match.decisionId}</h3>
        <span className="score">{match.facts ? 'Hindsight recall' : 'Demo match'}</span>
      </div>
      {decision && <p className="meta">{decision.team} team, {decision.date}</p>}
      <p className="why"><strong>Why it is relevant:</strong> {match.why}</p>
    </button>
  )
}
