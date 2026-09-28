export default function MemoryCard({ match, decision, active, onOpen }) {
  return (
    <button className={`record memory-card ${active ? 'is-active' : ''}`} onClick={() => onOpen?.(decision.id)}>
      <div className="memory-top">
        <h3>{decision.title}</h3>
        <span className="score" title="Keyword match in the local demo">Demo match</span>
      </div>
      <p className="meta">{decision.team} team, {decision.date}</p>
      <p className="why"><strong>Why it is relevant:</strong> {match.why}</p>
    </button>
  )
}
