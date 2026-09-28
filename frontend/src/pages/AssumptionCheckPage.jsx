import { useEffect, useState } from 'react'
import AssumptionCheck from '../components/AssumptionCheck'
import { listDecisions, reassessDecision } from '../api'
import { decisions, assumptionChecks } from '../mockData'

export default function AssumptionCheckPage({ liveMode, collectionId }) {
  const [available, setAvailable] = useState(liveMode ? [] : decisions)
  const [id, setId] = useState(liveMode ? '' : decisions[0].id)
  const [info, setInfo] = useState(liveMode ? '' : assumptionChecks[decisions[0].id].newCircumstance)
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(liveMode)
  const decision = available.find((item) => item.id === id)

  useEffect(() => {
    if (!liveMode) return
    let active = true
    listDecisions(collectionId).then((response) => {
      const items = Array.isArray(response) ? response : response?.decisions
      if (!Array.isArray(items)) throw new Error('The backend returned an invalid decision list.')
      if (active) {
        setAvailable(items)
        setId(items[0]?.id || '')
      }
    }).catch((cause) => { if (active) setError(cause.message || 'Decisions could not be loaded.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [liveMode, collectionId])

  const run = async () => {
    if (!id || !info.trim() || busy) return
    setError('')
    setResult(null)
    if (!liveMode) {
      setResult(assumptionChecks[id])
      return
    }
    setBusy(true)
    try {
      const response = await reassessDecision(id, info.trim(), collectionId)
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
      {loading && <section className="card" role="status">Loading decisions…</section>}
      {!loading && available.length === 0 && !error && <section className="card">No decisions are available to reassess. Record one first.</section>}
      {decision && <section className="card proposal">
        <label htmlFor="decision-select">Decision to reassess</label>
        <select id="decision-select" value={id} disabled={busy} onChange={(event) => {
          const next = event.target.value
          setId(next)
          setInfo(liveMode ? '' : assumptionChecks[next].newCircumstance)
          setResult(null)
          setError('')
        }}>
          {available.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
        </select>
        <div className="original-assumptions"><strong>Original assumptions</strong><ul>{(decision.assumptions || []).map((item) => <li key={item}>{item}</li>)}</ul></div>
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
      </section>}
      {busy && <section className="card" role="status">Comparing the new circumstances with the original assumptions…</section>}
      {error && <section className="card error-state" role="alert"><h2>Reassessment could not finish</h2><p>{error}</p><button className="btn" onClick={run}>Try again</button></section>}
      <AssumptionCheck check={result} />
    </div>
  )
}
