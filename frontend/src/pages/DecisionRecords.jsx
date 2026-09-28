import { useState } from 'react'
import DecisionCard from '../components/DecisionCard'
import EmptyState from '../components/EmptyState'
import { decisions } from '../mockData'

export default function DecisionRecords() {
  const [query, setQuery] = useState('')
  const q = query.toLowerCase()
  const list = decisions.filter((d) => `${d.title} ${d.team} ${d.tags.join(' ')}`.toLowerCase().includes(q))

  return (
    <div className="stack">
      <input
        className="search"
        type="search"
        placeholder="Search by title, team or technology"
        aria-label="Search decisions"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {list.length === 0 ? (
        <EmptyState title="No records match" body="Try a different keyword or clear the search." actionLabel="Clear search" onAction={() => setQuery('')} />
      ) : (
        list.map((d) => <DecisionCard key={d.id} decision={d} />)
      )}
    </div>
  )
}