export default function EmptyState({ title, body, actionLabel, onAction }) {
  return (
    <section className="empty">
      <h3>{title}</h3>
      <p>{body}</p>
      {actionLabel && (
        <button className="btn" onClick={onAction}>{actionLabel}</button>
      )}
    </section>
  )
}