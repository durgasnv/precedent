import { useEffect, useState } from 'react'
import TimelineItem from '../components/TimelineItem'
import EmptyState from '../components/EmptyState'
import { listTimeline } from '../api'
import { timelineEvents } from '../mockData'

export default function Timeline({ liveMode, collectionId }) {
  const [events, setEvents] = useState(liveMode ? [] : timelineEvents)
  const [loading, setLoading] = useState(liveMode)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!liveMode) return
    let active = true
    listTimeline(collectionId).then((response) => {
      if (!Array.isArray(response)) throw new Error('The backend returned an invalid timeline.')
      if (active) setEvents(response.map((event) => ({
        ...event,
        date: event.at?.slice(0, 10),
        type: event.kind === 'reassessed' ? 'Reassessed' : 'Recorded',
        title: event.title,
        description: event.kind === 'reassessed'
          ? `${event.changed_circumstances} — ${event.assessment?.reason || 'Reassessment recorded.'}`
          : 'Decision recorded and retained in memory.',
      })))
    }).catch((cause) => { if (active) setError(cause.message || 'History could not be loaded.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [liveMode, collectionId])

  if (loading) return <section className="card" role="status">Loading decision history…</section>
  if (error) return <section className="card error-state" role="alert"><h2>History unavailable</h2><p>{error}</p></section>
  if (events.length === 0) return <EmptyState title="No history yet" body="Record a technical decision in this collection to begin its timeline." />
  return <ol className="timeline">{events.map((event) => <TimelineItem key={event.id} event={event} />)}</ol>
}
