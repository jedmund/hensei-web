import { PUBLIC_SIERO_API_URL } from '$env/static/public'

export type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
export type Dict = Record<string, unknown>

// Compute a stable API base that always includes the versioned prefix.
function computeApiBase(): string {
  const raw = (PUBLIC_SIERO_API_URL || 'http://localhost:3000') as string
  const u = new URL(raw, raw.startsWith('http') ? undefined : 'http://localhost')
  const origin = u.origin
  const path = u.pathname.replace(/\/$/, '')
  const hasVersion = /(\/api\/v1|\/v1)$/.test(path)
  const basePath = hasVersion ? path : `${path}/api/v1`
  return `${origin}${basePath}`
}

export const API_BASE = computeApiBase()

export function buildUrl(path: string, params?: Dict) {
  const url = new URL(path.startsWith('http') ? path : `${API_BASE}${path}`, API_BASE)
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue
      if (Array.isArray(value)) value.forEach((x) => url.searchParams.append(key, String(x)))
      else url.searchParams.set(key, String(value))
    }
  }
  return url.toString()
}

export async function json<T>(fetchFn: FetchLike, url: string, init?: RequestInit): Promise<T> {
  const res = await fetchFn(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init
  })

  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`)
  return res.json() as Promise<T>
}

export const get = <T>(f: FetchLike, path: string, params?: Dict, init?: RequestInit) =>
  json<T>(f, buildUrl(path, params), init)

export const post = <T>(f: FetchLike, path: string, body?: unknown, init?: RequestInit) => {
  const extra = body !== undefined ? { body: JSON.stringify(body) } : {}
  return json<T>(f, buildUrl(path), { method: 'POST', ...extra, ...init })
}

export const put = <T>(f: FetchLike, path: string, body?: unknown, init?: RequestInit) => {
  const extra = body !== undefined ? { body: JSON.stringify(body) } : {}
  return json<T>(f, buildUrl(path), { method: 'PUT', ...extra, ...init })
}

export const del = <T>(f: FetchLike, path: string, init?: RequestInit) =>
  json<T>(f, buildUrl(path), { method: 'DELETE', ...init })
