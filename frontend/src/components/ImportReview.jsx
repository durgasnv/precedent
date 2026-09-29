import { useState } from 'react'
import { previewImport, saveImportedDecision } from '../api'

const fields = [
  ['title', 'Title'], ['problem', 'Problem or goal'], ['approach', 'Approach tried'],
  ['outcome', 'Observed outcome'], ['failure_reason', 'Reason or blocker'],
  ['decision', 'Final decision'],
]
const required = new Set(['title', 'problem', 'approach', 'outcome', 'decision'])
const lines = (value) => value.split('\n').map((item) => item.trim()).filter(Boolean)

export default function ImportReview({ collectionId, onSaved }) {
  const [text, setText] = useState('')
  const [filename, setFilename] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [preview, setPreview] = useState(null)
  const [values, setValues] = useState({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const readFile = async (file) => {
    if (!file) return
    const content = await file.text()
    setText(content)
    setFilename(file.name)
    setPreview(null)
  }

  const extract = async () => {
    setBusy(true)
    setError('')
    try {
      const result = await previewImport({ text, filename, sourceUrl }, collectionId)
      setPreview(result)
      setValues({ ...result.draft, assumptions: '', reconsider_when: '', alternatives: '' })
    } catch (cause) { setError(cause.message || 'The note could not be extracted.') }
    finally { setBusy(false) }
  }

  const save = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const draft = { ...values, assumptions: lines(values.assumptions || ''),
        reconsider_when: lines(values.reconsider_when || ''), alternatives: lines(values.alternatives || '') }
      const saved = await saveImportedDecision({ text, filename, sourceUrl, sourceHash: preview.source.sha256,
        draft, passages: preview.passages }, collectionId)
      await onSaved(saved)
      setText('')
      setFilename('')
      setSourceUrl('')
      setPreview(null)
      setValues({})
    } catch (cause) { setError(cause.message || 'The reviewed decision could not be saved.') }
    finally { setBusy(false) }
  }

  return <section className="card decision-form">
    <h2>Import a decision note</h2>
    <p>Paste notes or choose a Markdown or text file. Review every extracted field before saving it to Hindsight.</p>
    <label htmlFor="import-file">Text or Markdown file</label>
    <input id="import-file" type="file" accept=".md,.txt,text/plain,text/markdown"
      disabled={busy} onChange={(event) => readFile(event.target.files?.[0]).catch(cause => setError(cause.message))} />
    <label htmlFor="import-text">Source text</label>
    <textarea id="import-text" rows={8} maxLength={20000} value={text} disabled={busy}
      onChange={(event) => { setText(event.target.value); setPreview(null) }} />
    <label htmlFor="import-url">Source URL (optional)</label>
    <input id="import-url" className="search" type="url" value={sourceUrl} disabled={busy}
      onChange={(event) => { setSourceUrl(event.target.value); setPreview(null) }} />
    <button className="btn" type="button" disabled={busy || !text.trim()} onClick={extract}>
      {busy && !preview ? 'Extracting' : 'Extract draft'}
    </button>
    {preview && <form onSubmit={save}>
      <h3>Review draft</h3>
      <p>Quoted passages come from the submitted note. Fill missing fields and correct any extracted value.</p>
      <div className="form-grid">{fields.map(([key, label]) => <div key={key}>
        <label htmlFor={'import-' + key}>{label}{required.has(key) ? ' *' : ''}</label>
        <textarea id={'import-' + key} rows={3} value={values[key] || ''} required={required.has(key)}
          disabled={busy} onChange={(event) => setValues({ ...values, [key]: event.target.value })} />
        {preview.passages[key]
          ? <blockquote>{preview.passages[key].text}</blockquote>
          : <small>No exact source passage found. Verify this field manually.</small>}
      </div>)}</div>
      {[
        ['assumptions', 'Original assumptions, one per line'],
        ['reconsider_when', 'Reconsider when, one per line'],
        ['alternatives', 'Alternatives, one per line'],
      ].map(([key, label]) => <div key={key}>
        <label htmlFor={'import-' + key}>{label}</label>
        <textarea id={'import-' + key} rows={2} value={values[key] || ''} disabled={busy}
          onChange={(event) => setValues({ ...values, [key]: event.target.value })} />
      </div>)}
      <button className="btn btn-primary" disabled={busy}>Save reviewed decision</button>
    </form>}
    {error && <p className="form-error" role="alert">{error}</p>}
  </section>
}
