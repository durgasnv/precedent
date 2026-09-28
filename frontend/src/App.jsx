import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Inbox from './pages/Inbox'
import MemoryMatch from './pages/MemoryMatch'
import DecisionRecords from './pages/DecisionRecords'
import AssumptionCheckPage from './pages/AssumptionCheckPage'
import Timeline from './pages/Timeline'
import { decisions, findMatches } from './mockData'

const PAGES = {
  inbox: { label: 'Decision Inbox', subtitle: 'Propose a change and see what the team already learned.' },
  memory: { label: 'Memory Match', subtitle: 'Past experiments related to your latest proposal.' },
  records: { label: 'Decision Records', subtitle: 'Every stored decision, with the reasons behind it.' },
  assumptions: { label: 'Assumption Check', subtitle: 'Test an old blocker against what is true today.' },
  timeline: { label: 'Timeline', subtitle: 'How decisions unfolded, oldest to newest.' },
}

export default function App() {
  const [page, setPage] = useState('inbox')
  const [proposal, setProposal] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | done
  const [matches, setMatches] = useState([])

  const analyze = () => {
    if (!proposal.trim() || status === 'loading') return
    setStatus('loading')
    // TODO(backend): replace this timeout with a call to the Hindsight/API endpoint
    setTimeout(() => {
      setMatches(findMatches(proposal))
      setStatus('done')
    }, 2800)
  }

  const shared = { proposal, setProposal, status, matches, analyze, onNavigate: setPage }

  return (
    <div className="app">
      <Sidebar pages={PAGES} current={page} onNavigate={setPage} memoryCount={decisions.length} />
      <main className="main">
        <Header
          title={PAGES[page].label}
          subtitle={PAGES[page].subtitle}
          status={status === 'loading' ? 'Searching memory' : `${decisions.length} records in memory`}
          busy={status === 'loading'}
        />
        <div className="content">
          {page === 'inbox' && <Inbox {...shared} />}
          {page === 'memory' && <MemoryMatch {...shared} />}
          {page === 'records' && <DecisionRecords />}
          {page === 'assumptions' && <AssumptionCheckPage />}
          {page === 'timeline' && <Timeline />}
        </div>
      </main>
    </div>
  )
}