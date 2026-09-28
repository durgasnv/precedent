export default function ProposalInput({ value, onChange, onAnalyze, loading }) {
  return (
    <section className="card proposal">
      <label htmlFor="proposal">Technical proposal</label>
      <textarea
        id="proposal"
        rows={5}
        value={value}
        placeholder="Example: Switch the live dashboard from polling to WebSockets so incidents update instantly."
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') onAnalyze()
        }}
      />
      <div className="proposal-actions">
        <span className="hint">Ctrl or Cmd + Enter to analyze</span>
        <button className="btn btn-primary" onClick={onAnalyze} disabled={loading || !value.trim()}>
          {loading ? 'Analyzing' : 'Analyze proposal'}
        </button>
      </div>
    </section>
  )
}