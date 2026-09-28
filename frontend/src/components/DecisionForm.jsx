import { useState } from 'react'

const initial = {
  title: '', problem: '', approach: '', outcome: '', failure_reason: '',
  alternatives: '', decision: '', assumptions: '', reconsider_when: '', evidence: '',
}
const fields = [
  ['title', 'Title'], ['problem', 'Problem or goal'], ['approach', 'Approach tried'],
  ['outcome', 'Outcome'], ['failure_reason', 'Reason it failed or succeeded'],
  ['alternatives', 'Alternatives considered, one per line'], ['decision', 'Final decision'],
  ['assumptions', 'Original assumptions, one per line'],
  ['reconsider_when', 'Reconsider when, one per line'], ['evidence', 'Evidence or references, one per line'],
]
const required = new Set(['title', 'problem', 'approach', 'outcome', 'decision'])
const lists = new Set(['alternatives', 'assumptions', 'reconsider_when', 'evidence'])

export default function DecisionForm({ onSave }) {
  const [values, setValues] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    const record = Object.fromEntries(Object.entries(values).map(([key, value]) => [
      key, lists.has(key) ? value.split('\n').map((item) => item.trim()).filter(Boolean) : value.trim(),
    ]))
    record.id = crypto.randomUUID()
    record.date = new Date().toISOString().slice(0, 10)
    try {
      await onSave(record)
      setValues(initial)
    } catch (cause) {
      setError(cause.message || 'The decision could not be saved.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="card decision-form" onSubmit={submit}>
      <h2>Record a technical decision</h2>
      <p className="meta">The backend will save this record and retain its context in Hindsight.</p>
      <div className="form-grid">
        {fields.map(([key, label]) => <div key={key}>
          <label htmlFor={`record-${key}`}>{label}</label>
          <textarea id={`record-${key}`} rows={key === 'problem' || key === 'outcome' ? 3 : 2} required={required.has(key)} value={values[key]} disabled={busy} onChange={(event) => setValues({ ...values, [key]: event.target.value })} />
        </div>)}
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? 'Saving decision' : 'Save decision'}</button>
    </form>
  )
}
