import { describe, expect, it } from 'vitest'
import { buildApiUrl, normalizeApiBase } from './api.js'

describe('API URL construction', () => {
  it('unwraps a Markdown-formatted Vercel environment value', () => {
    expect(normalizeApiBase('[https://api.hasantechlab.com/api](https://api.hasantechlab.com/api)')).toBe('https://api.hasantechlab.com/api')
  })

  it('keeps endpoint paths under the API base without nesting the frontend origin', () => {
    const base = normalizeApiBase('https://api.hasantechlab.com/api')
    expect(new URL('user/snapshots', `${base}/`).toString()).toBe('https://api.hasantechlab.com/api/user/snapshots')
    expect(buildApiUrl('/user/snapshots')).toBe('/api/user/snapshots')
  })
})
