export default function TimelineItem({ event, onOpen }) {
  return (
    <li className={`tl-item tl-${event.type.toLowerCase()}`}>
      <span className="tl-dot" aria-hidden="true" />
      <div className="tl-body">
        <time>{event.date}</time>
        <h3>{event.title}</h3>
        <span className="tl-type">{event.type}</span>
        {event.description && <p>{event.description}</p>}
        {onOpen && (
          <button className="link" onClick={() => onOpen(event.decisionId)}>View record</button>
        )}
      </div>
    </li>
  )
}
