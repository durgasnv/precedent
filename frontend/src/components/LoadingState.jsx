const STEPS = [
  'Reading your proposal',
  'Searching past decisions',
  'Finding why they failed',
  'Comparing old assumptions with today',
]

export default function LoadingState() {
  return (
    <section className="card loading" role="status" aria-live="polite">
      <div className="scanner" aria-hidden="true"><span /></div>
      <ol>
        {STEPS.map((s, i) => (
          <li key={s} style={{ animationDelay: `${i * 0.65}s` }}>{s}</li>
        ))}
      </ol>
    </section>
  )
}