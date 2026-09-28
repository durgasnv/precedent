import { useState } from 'react'
import AssumptionCheck from '../components/AssumptionCheck'
import { decisions, assumptionChecks } from '../mockData'

export default function AssumptionCheckPage() {
  const [id, setId] = useState(decisions[0].id)
  const [info, setInfo] = useState('')
  const [result, setResult] = useState(null)

  const run = () => {
    // TODO(backend): send `info` and the decision to the reassessment endpoint
    setResult(assumptionChecks[id])
  }

  return (
    <div className="stack">
      <section className="card proposal">
        <label htmlFor="decision-select">Decision to reassess</label>
        <select id="decision-select" value={id} onChange={(e) => { setId(e.target.value); setResult(null) }}>
          {decisions.map((d) => (
            <option key={d.id} value={d.id}>{d.title}</option>
          ))}
        </select>
        <label htmlFor="new-info">What has changed since then?</label>
        <textarea
          id="new-info"
          rows={3}
          value={info}
          placeholder="Example: We moved to a managed gateway with WebSocket support."
          onChange={(e) => setInfo(e.target.value)}
        />
        <div className="proposal-actions">
          <span className="hint">Demo mode returns a prepared reassessment.</span>
          <button className="btn btn-primary" onClick={run}>Reassess decision</button>
        </div>
      </section>
      <AssumptionCheck check={result} />
    </div>
  )
}