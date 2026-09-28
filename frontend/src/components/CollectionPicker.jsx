import { useEffect, useState } from 'react'
import { createCollection, listCollections } from '../api'

export default function CollectionPicker({ selected, onSelect }) {
  const [collections, setCollections] = useState([selected])
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    listCollections().then((items) => {
      if (!Array.isArray(items)) throw new Error('Could not read decision collections.')
      if (active) setCollections(items)
    }).catch((cause) => { if (active) setError(cause.message) })
    return () => { active = false }
  }, [])

  const create = async (event) => {
    event.preventDefault()
    if (!name.trim() || busy) return
    setBusy(true)
    setError('')
    try {
      const collection = await createCollection(name.trim())
      onSelect(collection)
    } catch (cause) {
      setError(cause.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="card collection-picker">
      <div>
        <label htmlFor="collection">Decision collection</label>
        <select id="collection" value={selected.id} disabled={busy} onChange={(event) => onSelect(collections.find((item) => item.id === event.target.value))}>
          {collections.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <p className="hint">Proposals use only the history in this collection.</p>
      </div>
      <form onSubmit={create}>
        <label htmlFor="collection-name">Start a different example</label>
        <input id="collection-name" className="search" value={name} maxLength={80} placeholder="e.g. Database migration" disabled={busy} onChange={(event) => setName(event.target.value)} required />
        <button className="btn" disabled={busy || !name.trim()}>{busy ? 'Creating' : 'Create empty collection'}</button>
      </form>
      {error && <p role="alert" className="form-error">{error}</p>}
    </section>
  )
}
