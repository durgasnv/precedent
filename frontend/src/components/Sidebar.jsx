export default function Sidebar({ pages, current, onNavigate, memoryCount, liveMode }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true" />
        <span className="brand-name">PRECEDENT</span>
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
          <strong>{liveMode ? 'Live mode' : 'Demo mode'}</strong>
          <span>{liveMode ? 'Backend analysis enabled' : `${memoryCount} example decisions`}</span>
        </div>
      </div>
    </aside>
  )
}
