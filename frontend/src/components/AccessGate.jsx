import { useState } from 'react'

export default function AccessGate({ onSignIn, error, busy }) {
  const [token, setToken] = useState('')
  const submit = async (event) => {
    event.preventDefault()
    await onSignIn(token)
  }
  return <main className="main"><div className="content"><form className="card decision-form" onSubmit={submit}>
    <h1>PRECEDENT access</h1>
    <p>Enter the personal access token issued by your workspace operator.</p>
    <label htmlFor="access-token">Access token</label>
    <input id="access-token" className="search" type="password" autoComplete="off"
      value={token} onChange={(event) => setToken(event.target.value)} required />
    {error && <p className="form-error" role="alert">{error}</p>}
    <button className="btn btn-primary" disabled={busy || !token.trim()}>
      {busy ? 'Checking access' : 'Sign in'}
    </button>
  </form></div></main>
}
