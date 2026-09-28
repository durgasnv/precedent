function Field({ label, children, tone }) {
  return (
    <div className={`field-block ${tone || ''}`}>
      <h4>{label}</h4>
      {children}
    </div>
  )
}

const List = ({ items }) => (
  <ul>
    {items.map((i) => (
      <li key={i}>{i}</li>
    ))}
  </ul>
)

export default function DecisionCard({ decision: d, demo = true }) {
  return (
    <article className="record decision-card">
      <div className="record-stamp">{demo ? 'Demo decision record' : 'Historical decision record'}{d.date ? `, ${d.date}` : ''}</div>
      <h2>{d.title}</h2>
      <p className="meta">{d.team} team</p>
      <div className="decision-grid">
        <Field label="Problem"><p>{d.problem}</p></Field>
        <Field label="Approach tried"><p>{d.approach}</p></Field>
        <Field label="Outcome"><p>{d.outcome}</p></Field>
        <Field label="Reason or blocker" tone="danger"><p>{d.failureReason}</p></Field>
        <Field label="Alternatives considered"><List items={d.alternatives} /></Field>
        <Field label="Decision made"><p>{d.decision}</p></Field>
        <Field label="Assumptions"><List items={d.assumptions} /></Field>
        <Field label="Reconsider when"><List items={d.reconsiderWhen} /></Field>
      </div>
    </article>
  )
}
