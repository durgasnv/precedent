const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')

export const liveMode = Boolean(baseUrl)

async function request(path, body, method = 'POST', collectionId = 'demo') {
  let response
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', 'X-Precedent-Collection': collectionId },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
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
    throw new Error(typeof data?.error?.message === 'string' ? data.error.message : 'The request failed. Please try again.')
  }
  return data?.data ?? data
}

export const analyzeProposal = (proposal, collectionId) => request('/api/analyze', { proposal }, 'POST', collectionId)
export const reassessDecision = (decision_id, changed_circumstances, collectionId) =>
  request('/api/reassess', { decisionId: decision_id, changedCircumstances: changed_circumstances }, 'POST', collectionId)
export const listDecisions = (collectionId) => request('/api/decisions', undefined, 'GET', collectionId)
export const fetchDecision = (id, collectionId) => request(`/api/decisions/${encodeURIComponent(id)}`, undefined, 'GET', collectionId)
export const createDecision = (decision, collectionId) => request('/api/decisions', decision, 'POST', collectionId)
export const listCollections = () => request('/api/collections', undefined, 'GET')
export const createCollection = (name) => request('/api/collections', { name })
export const listTimeline = (collectionId) => request('/api/timeline', undefined, 'GET', collectionId)
