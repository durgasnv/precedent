import { useState } from 'react'
import AssumptionCheck from '../components/AssumptionCheck'
import { reassessDecision } from '../api'
import { decisions, assumptionChecks } from '../mockData'

export default function AssumptionCheckPage({ liveMode }) {
  const [id, setId] = useState(decisions[0].id)
  const [info, setInfo] = useState(liveMode ? '' : assumptionChecks[decisions[0].id].newCircumstance)
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const decision = decisions.find((item) => item.id === id)

  const run = async () => {
    if (!info.trim() || busy) return
    setError('')
    setResult(null)
    if (!liveMode) {
      setResult(assumptionChecks[id])
      return
    }
    setBusy(true)
    try {
      const response = await reassessDecision(id, info.trim())
      if (!['still_relevant', 'may_have_changed', 'insufficient_information'].includes(response?.status)) {
        throw new Error('The backend returned an invalid reassessment.')
      }
      setResult(response)
    } catch (cause) {
      setError(cause.message || 'Reassessment failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="stack">
      <section className="card proposal">
        <label htmlFor="decision-select">Decision to reassess</label>
        <select id="decision-select" value={id} disabled={busy} onChange={(event) => {
          const next = event.target.value
          setId(next)
          setInfo(liveMode ? '' : assumptionChecks[next].newCircumstance)
          setResult(null)
          setError('')
        }}>
          {decisions.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
        </select>
        <div className="original-assumptions"><strong>Original assumptions</strong><ul>{decision.assumptions.map((item) => <li key={item}>{item}</li>)}</ul></div>
        <label htmlFor="new-info">What has changed since then?</label>
        <textarea
          id="new-info"
          rows={3}
          value={info}
          readOnly={!liveMode}
          placeholder="Example: We moved to a managed gateway with WebSocket support."
          onChange={(event) => { setInfo(event.target.value); setResult(null) }}
        />
        <div className="proposal-actions">
          <span className="hint">{liveMode ? 'Your new information is compared with the historical record.' : 'Prepared example. Connect the backend to enter your own circumstances.'}</span>
          <button className="btn btn-primary" onClick={run} disabled={busy || !info.trim()}>{busy ? 'Reassessing' : liveMode ? 'Reassess decision' : 'Show example reassessment'}</button>
        </div>
      </section>
      {busy && <section className="card" role="status">Comparing the new circumstances with the original assumptions…</section>}
      {error && <section className="card error-state" role="alert"><h2>Reassessment could not finish</h2><p>{error}</p><button className="btn" onClick={run}>Try again</button></section>}
      <AssumptionCheck check={result} />
    </div>
  )
}
