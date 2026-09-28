import { useEffect, useState } from 'react'
import { fetchDecision } from '../api'
import DecisionCard from './DecisionCard'

export default function LiveDecisionCard({ id }) {
  const [record, setRecord] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    fetchDecision(id).then((response) => {
      const decision = response?.decision || response
      if (!decision?.id) throw new Error('The backend returned an invalid decision record.')
      if (active) setRecord(decision)
    }).catch((cause) => { if (active) setError(cause.message || 'The decision record could not be loaded.') })
    return () => { active = false }
  }, [id])

  if (error) return <section className="card error-state" role="alert"><h2>Decision detail unavailable</h2><p>{error}</p></section>
  if (!record || record.id !== id) return <section className="card" role="status">Loading historical decision…</section>
  return <DecisionCard decision={record} demo={false} />
}
