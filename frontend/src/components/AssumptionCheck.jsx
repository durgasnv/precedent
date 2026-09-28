const LABELS = { changed: 'No longer true', holds: 'Still holds', unknown: 'Needs data' }

export default function AssumptionCheck({ check }) {
  if (!check) return null
  return (
    <section className="ai-panel">
      <div className="ai-stamp">Prepared demo reassessment</div>
      <div className="new-circ">
        <h4>New circumstance</h4>
        <p>{check.newCircumstance}</p>
      </div>
      <div className="compare">
        <div className="compare-head">Original blocker</div>
        <div className="compare-head">Today</div>
        {check.rows.map((r) => (
          <div className="compare-row" key={r.assumption}>
            <p className="old">{r.assumption}</p>
            <p>
              <span className={`badge badge-${r.status}`}>{LABELS[r.status]}</span>
              {r.now}
            </p>
          </div>
        ))}
      </div>
      <div className="verdict">
        <h4>Reassessment</h4>
        <p>{check.verdict}</p>
      </div>
    </section>
  )
}
