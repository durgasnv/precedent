const LABELS = { changed: 'No longer true', holds: 'Still holds', unknown: 'Needs data' }

export default function AssumptionCheck({ check }) {
  if (!check) return null
  if (check.status) {
    const statusLabels = {
      still_relevant: 'Original blocker still relevant',
      may_have_changed: 'Original blocker may have changed',
      insufficient_information: 'More information needed',
    }
    return (
      <section className="ai-panel">
        <div className="ai-stamp">Current reassessment · Historical decision preserved</div>
        <div className="new-circ"><h4>New circumstance</h4><p>{check.changed_circumstances}</p></div>
        <div className="verdict"><h4>{statusLabels[check.status]}</h4><p>{check.reason}</p></div>
        <div><h4>Assumptions challenged</h4>{check.challenged_assumptions?.length ? <ul>{check.challenged_assumptions.map((item) => <li key={item}>{item}</li>)}</ul> : <p>None identified.</p>}</div>
        <div><h4>Evidence still needed</h4>{check.evidence_gaps?.length ? <ul>{check.evidence_gaps.map((item) => <li key={item}>{item}</li>)}</ul> : <p>No additional evidence listed.</p>}</div>
      </section>
    )
  }
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
