import { useEffect, useState } from 'react'
import DecisionCard from '../components/DecisionCard'
import DecisionForm from '../components/DecisionForm'
import EmptyState from '../components/EmptyState'
import { createDecision, listDecisions } from '../api'
import { decisions as demoDecisions } from '../mockData'

function forDisplay(record) {
  return {
    ...record,
    team: record.team || 'Engineering',
    tags: record.tags || record.technologies || [],
    failureReason: record.failure_reason || 'No separate reason recorded.',
    reconsiderWhen: record.reconsider_when || [],
    alternatives: record.alternatives || [],
    assumptions: record.assumptions || [],
  }
}

export default function DecisionRecords({ liveMode, collectionId }) {
  const [query, setQuery] = useState('')
  const [records, setRecords] = useState(liveMode ? [] : demoDecisions)
  const [busy, setBusy] = useState(liveMode)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!liveMode) return
    let active = true
    listDecisions(collectionId).then((response) => {
      const items = Array.isArray(response) ? response : response?.decisions
      if (!Array.isArray(items)) throw new Error('The backend returned an invalid decision list.')
      if (active) setRecords(items.map(forDisplay))
    }).catch((cause) => {
      if (active) setError(cause.message || 'Decisions could not be loaded.')
    }).finally(() => { if (active) setBusy(false) })
    return () => { active = false }
  }, [liveMode, collectionId])

  const save = async (record) => {
    const response = await createDecision(record, collectionId)
    const saved = response?.decision || response
    if (!saved?.id) throw new Error('The backend did not confirm the saved decision.')
    setRecords((previous) => [forDisplay(saved), ...previous])
    setError('')
  }

  const q = query.toLowerCase()
  const list = records.filter((record) => `${record.title} ${record.team} ${record.tags.join(' ')}`.toLowerCase().includes(q))

  return (
    <div className="stack">
      {liveMode ? <DecisionForm onSave={save} /> : <section className="card"><p>These are example records. Connect the backend to save a new decision to Hindsight.</p></section>}
      <input className="search" type="search" placeholder="Search by title, team or technology" aria-label="Search decisions" value={query} onChange={(event) => setQuery(event.target.value)} />
      {busy && <section className="card" role="status">Loading decisions…</section>}
      {error && <section className="card error-state" role="alert"><h2>Decisions could not be loaded</h2><p>{error}</p></section>}
      {!busy && !error && list.length === 0 && <EmptyState title={records.length ? 'No records match' : 'No decisions recorded yet'} body={records.length ? 'Try a different keyword or clear the search.' : 'Record the first technical decision above.'} actionLabel={records.length ? 'Clear search' : undefined} onAction={() => setQuery('')} />}
      {list.map((record) => <DecisionCard key={record.id} decision={record} demo={!liveMode} />)}
    </div>
  )
}
