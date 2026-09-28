export default function Sidebar({ pages, current, onNavigate, memoryCount }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true" />
        <span className="brand-name">Precedent</span>
      </div>
      <nav className="nav" aria-label="Main">
        {Object.entries(pages).map(([key, p]) => (
          <button
            key={key}
            className={`nav-item ${current === key ? 'is-active' : ''}`}
            onClick={() => onNavigate(key)}
            aria-current={current === key ? 'page' : undefined}
          >
            {p.label}
          </button>
        ))}
      </nav>
      <div className="memory-status">
        <span className="pulse" aria-hidden="true" />
        <div>
          <strong>Memory connected</strong>
          <span>{memoryCount} demo decisions</span>
        </div>
      </div>
    </aside>
  )
}
