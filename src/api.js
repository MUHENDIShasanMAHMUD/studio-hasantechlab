const DEFAULT_API_BASE = import.meta.env.PROD ? 'https://api.hasantechlab.com/api' : '/api'

export function normalizeApiBase(value) {
  const rawValue = String(value || '').trim().replace(/^['"]|['"]$/g, '')
  const markdownMatch = rawValue.match(/^\[[^\]]+\]\((https?:\/\/[^)]+)\)$/i)
  const bracketedUrl = rawValue.match(/^\[(https?:\/\/[^\]]+)\]$/i)
  const candidate = (markdownMatch?.[1] || bracketedUrl?.[1] || rawValue).replace(/\/+$/, '')

  if (/^https?:\/\//i.test(candidate)) {
    const url = new URL(candidate)
    if (import.meta.env.PROD && url.protocol !== 'https:') throw new Error('Production API_BASE must use HTTPS')
    return url.toString().replace(/\/+$/, '')
  }

  if (candidate.startsWith('/')) return candidate
  throw new Error('VITE_API_BASE must be an absolute URL or a root-relative path')
}

export function buildApiUrl(endpoint) {
  const cleanEndpoint = String(endpoint || '').replace(/^\/+/, '')
  if (/^https?:\/\//i.test(API_BASE)) return new URL(cleanEndpoint, `${API_BASE}/`).toString()
  return `${API_BASE}/${cleanEndpoint}`
}

const API_BASE = normalizeApiBase(import.meta.env.VITE_API_BASE || DEFAULT_API_BASE)

export async function apiFetch(path, options = {}) {
  const deviceToken = localStorage.getItem('techlab_device_token')
  const response = await fetch(buildApiUrl(path), {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(deviceToken ? { 'X-Device-Token': deviceToken } : {}), ...options.headers }
  })
  const contentType = response.headers.get('content-type') || ''
  const body = contentType.includes('application/json') ? await response.json().catch(() => ({})) : {}
  if (!response.ok) {
    if (response.status === 404 && !contentType.includes('application/json')) throw new Error('API endpoint is not deployed or is not routed to Express')
    throw new Error(body.error || `API request failed (${response.status})`)
  }
  return body
}

export const saveSnapshot = (payload) => apiFetch('/snapshots', { method: 'POST', body: JSON.stringify(payload) })
export const updateSnapshot = (id, payload) => apiFetch(`/snapshots/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
export const getSnapshot = (id) => apiFetch(`/snapshots/${id}`)
export const getMine = () => apiFetch('/user/snapshots')
