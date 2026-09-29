import { useEffect, useState } from 'react'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Inbox from './pages/Inbox'
import MemoryMatch from './pages/MemoryMatch'
import DecisionRecords from './pages/DecisionRecords'
import AssumptionCheckPage from './pages/AssumptionCheckPage'
import Timeline from './pages/Timeline'
import { decisions, findMatches } from './mockData'
import { analyzeProposal, clearAccessToken, getAccessToken, getCurrentUser, listCollections, liveMode, setAccessToken } from './api'
import CollectionPicker from './components/CollectionPicker'
import AccessGate from './components/AccessGate'

const PAGES = {
  inbox: { label: 'Decision Inbox', subtitle: 'Propose a change and see what the team already learned.' },
  memory: { label: 'Memory Match', subtitle: 'Past experiments related to your latest proposal.' },
  records: { label: 'Decision Records', subtitle: 'Every stored decision, with the reasons behind it.' },
  assumptions: { label: 'Assumption Check', subtitle: 'Test an old blocker against what is true today.' },
  timeline: { label: 'Timeline', subtitle: 'How decisions unfolded, oldest to newest.' },
}

export default function App() {
  const [collection, setCollection] = useState({ id: 'demo', name: 'Engineering examples' })
  const [access, setAccess] = useState(liveMode ? (getAccessToken() ? 'checking' : 'locked') : 'ready')
  const [accessError, setAccessError] = useState('')

  useEffect(() => {
    if (!liveMode) return
    const locked = () => setAccess('locked')
    window.addEventListener('precedent-unauthorized', locked)
    if (getAccessToken()) Promise.all([getCurrentUser(), listCollections()])
      .then(([, items]) => {
        if (!items.length) throw new Error('No decision collection is available for this user.')
        setCollection(items[0])
        setAccess('ready')
      }).catch(() => { clearAccessToken(); setAccess('locked') })
    return () => window.removeEventListener('precedent-unauthorized', locked)
  }, [])

  const signIn = async (token) => {
    setAccessError('')
    setAccess('checking')
    setAccessToken(token)
    try {
      const [, items] = await Promise.all([getCurrentUser(), listCollections()])
      if (!items.length) throw new Error('No decision collection is available for this user.')
      setCollection(items[0])
      setAccess('ready')
    } catch (cause) {
      clearAccessToken()
      setAccessError(cause.message || 'Access could not be confirmed.')
      setAccess('locked')
    }
  }
  if (access === 'checking') return <main className="main"><div className="content">Checking PRECEDENT access…</div></main>
  if (access === 'locked') return <AccessGate onSignIn={signIn} error={accessError} busy={false} />
  const signOut = () => { clearAccessToken(); setAccess('locked') }
  return <Workspace key={collection.id} collection={collection}
    onCollectionChange={setCollection} onSignOut={signOut} />
}

function Workspace({ collection, onCollectionChange, onSignOut }) {
  const collectionId = collection.id
  const [page, setPage] = useState('inbox')
  const [proposal, setProposal] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | done | error
  const [matches, setMatches] = useState([])
  const [analysis, setAnalysis] = useState(null)
  const [noMatchReason, setNoMatchReason] = useState('')
  const [error, setError] = useState('')

  const analyze = async () => {
    if (!proposal.trim() || status === 'loading') return
    setStatus('loading')
    setError('')
    setAnalysis(null)
    setMatches([])
    try {
      if (liveMode) {
        const result = await analyzeProposal(proposal.trim(), collectionId)
        if (!Array.isArray(result?.decision_matches)) throw new Error('The backend returned an invalid analysis.')
        setMatches(result.decision_matches.map((group) => ({
          decisionId: group.decision_id,
          title: group.title,
          why: group.matches?.map((match) => match.why_relevant).filter(Boolean).join(' ') || 'Related historical evidence was recalled.',
          facts: group.facts || [],
        })))
        setAnalysis(result.analysis)
        setNoMatchReason(result.no_match_reason || '')
      } else {
        const localMatches = findMatches(proposal)
        setMatches(localMatches)
        setNoMatchReason(localMatches.length ? '' : 'No demo record matched this proposal.')
      }
      setStatus('done')
    } catch (cause) {
      setError(cause.message || 'Analysis failed. Please try again.')
      setStatus('error')
    }
  }

  const shared = { proposal, setProposal, status, matches, analysis, noMatchReason, error, analyze, onNavigate: setPage, liveMode, collectionId }

  return (
    <div className="app">
      <Sidebar pages={PAGES} current={page} onNavigate={setPage} memoryCount={decisions.length} liveMode={liveMode} />
      <main className="main">
        <Header
          title={PAGES[page].label}
          subtitle={PAGES[page].subtitle}
          status={status === 'loading' ? 'Searching history' : liveMode ? 'Live analysis' : `${decisions.length} demo records`}
          busy={status === 'loading'}
        />
        <div className="content">
          {liveMode && <button className="btn" onClick={onSignOut}>Sign out</button>}
          {liveMode && <CollectionPicker selected={collection} onSelect={onCollectionChange} />}
          {page === 'inbox' && <Inbox {...shared} />}
          {page === 'memory' && <MemoryMatch {...shared} />}
          {page === 'records' && <DecisionRecords liveMode={liveMode} collectionId={collectionId} />}
          {page === 'assumptions' && <AssumptionCheckPage liveMode={liveMode} collectionId={collectionId} />}
          {page === 'timeline' && <Timeline liveMode={liveMode} collectionId={collectionId} />}
        </div>
      </main>
    </div>
  )
}
