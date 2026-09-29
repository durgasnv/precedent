import { useState } from 'react'
import { fetchDecisionSource } from '../api'

export default function SourceNote({ id, collectionId }) {
  const [source, setSource] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const open = async (event) => {
    if (!event.currentTarget.open || source || loading) return
    setLoading(true)
    try { setSource(await fetchDecisionSource(id, collectionId)) }
    catch (cause) { setError(cause.message || 'Source could not be loaded.') }
    finally { setLoading(false) }
  }
  return <details className="card" onToggle={open}>
    <summary>Reviewed source note</summary>
    {loading && <p>Loading source…</p>}
    {error && <p role="alert">{error}</p>}
    {source && <>
      <p>{source.filename || source.source_url || 'Imported note'}</p>
      {source.source_url && <a href={source.source_url} target="_blank" rel="noreferrer">Open source URL</a>}
      <p className="meta">SHA-256: {source.sha256}</p>
      <h3>Supporting passages</h3>
      <ul>{Object.entries(source.passages).filter(([, value]) => value).map(([field, passage]) =>
        <li key={field}><strong>{field}</strong><blockquote>{passage.text}</blockquote></li>)}</ul>
      <details><summary>Full original text</summary><pre>{source.content}</pre></details>
    </>}
  </details>
}
