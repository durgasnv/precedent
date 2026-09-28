export default function Header({ title, subtitle, status, busy }) {
  return (
    <header className="header">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <span className={`status-pill ${busy ? 'is-busy' : ''}`}>{status}</span>
    </header>
  )
}