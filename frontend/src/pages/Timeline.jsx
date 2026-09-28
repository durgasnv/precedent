import TimelineItem from '../components/TimelineItem'
import { timelineEvents } from '../mockData'

export default function Timeline() {
  return (
    <ol className="timeline">
      {timelineEvents.map((e) => (
        <TimelineItem key={e.id} event={e} />
      ))}
    </ol>
  )
}