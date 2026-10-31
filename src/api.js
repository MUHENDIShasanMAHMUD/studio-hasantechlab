const API_BASE = import.meta.env.VITE_API_BASE || '/api'

export async function apiFetch(path, options = {}) {
  const deviceToken = localStorage.getItem('techlab_device_token')
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(deviceToken ? { 'X-Device-Token': deviceToken } : {}), ...options.headers }
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.error || 'Request failed')
  return body
}

export const saveSnapshot = (payload) => apiFetch('/snapshots', { method: 'POST', body: JSON.stringify(payload) })
export const updateSnapshot = (id, payload) => apiFetch(`/snapshots/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
export const getSnapshot = (id) => apiFetch(`/snapshots/${id}`)
export const getMine = () => apiFetch('/user/snapshots')
