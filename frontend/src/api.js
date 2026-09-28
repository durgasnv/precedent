const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')

export const liveMode = Boolean(baseUrl)

async function request(path, body) {
  let response
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    throw new Error('The PRECEDENT backend could not be reached. Check its URL and try again.')
  }

  let data
  try {
    data = await response.json()
  } catch {
    throw new Error('The backend returned a response PRECEDENT could not read.')
  }
  if (!response.ok) {
    throw new Error(typeof data?.message === 'string' ? data.message : 'The request failed. Please try again.')
  }
  return data
}

export const analyzeProposal = (proposal) => request('/api/analyze', { proposal })
export const reassessDecision = (decision_id, changed_circumstances) =>
  request('/api/reassess', { decision_id, changed_circumstances })
