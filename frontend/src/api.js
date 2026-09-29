const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')
const tokenKey = 'precedent_access_token'
let accessToken = typeof window === 'undefined' ? '' : window.sessionStorage.getItem(tokenKey) || ''

export const liveMode = Boolean(baseUrl)
export const getAccessToken = () => accessToken
export function setAccessToken(token) {
  accessToken = token.trim()
  window.sessionStorage.setItem(tokenKey, accessToken)
}
export function clearAccessToken() {
  accessToken = ''
  window.sessionStorage.removeItem(tokenKey)
}

async function request(path, body, method = 'POST', collectionId = 'demo') {
  let response
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', 'X-Precedent-Collection': collectionId,
        ...(accessToken ? { Authorization: 'Bearer ' + accessToken } : {}) },
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
    if (response.status === 401) {
      clearAccessToken()
      window.dispatchEvent(new Event('precedent-unauthorized'))
    }
    throw new Error(typeof data?.error?.message === 'string' ? data.error.message : 'The request failed. Please try again.')
  }
  return data?.data ?? data
}

export const analyzeProposal = (proposal, collectionId) => request('/api/analyze', { proposal }, 'POST', collectionId)
export const getCurrentUser = () => request('/api/auth/me', undefined, 'GET')
export const reassessDecision = (decision_id, changed_circumstances, collectionId) =>
  request('/api/reassess', { decisionId: decision_id, changedCircumstances: changed_circumstances }, 'POST', collectionId)
export const listDecisions = (collectionId) => request('/api/decisions', undefined, 'GET', collectionId)
export const listPendingDecisions = (collectionId) => request('/api/decisions/pending', undefined, 'GET', collectionId)
export const retryDecision = (id, collectionId) => request('/api/decisions/' + encodeURIComponent(id) + '/retry', {}, 'POST', collectionId)
export const fetchDecision = (id, collectionId) => request(`/api/decisions/${encodeURIComponent(id)}`, undefined, 'GET', collectionId)
export const createDecision = (decision, collectionId) => request('/api/decisions', decision, 'POST', collectionId)
export const listCollections = () => request('/api/collections', undefined, 'GET')
export const createCollection = (name) => request('/api/collections', { name })
export const listTimeline = (collectionId) => request('/api/timeline', undefined, 'GET', collectionId)
