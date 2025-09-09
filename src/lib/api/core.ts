import { PUBLIC_SIERO_API_URL } from '$env/static/public'

export type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
export type Dict = Record<string, unknown>

const API = PUBLIC_SIERO_API_URL?.replace(/\/$/, '') ?? 'http://localhost:3000/api/v1'

export function buildUrl(path: string, params?: Dict) {
	const url = new URL(path.startsWith('http') ? path : `${API}${path}`, API)
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

export const post = <T>(f: FetchLike, path: string, body?: unknown, init?: RequestInit) =>
	json<T>(f, path, { method: 'POST', body: body ? JSON.stringify(body) : undefined, ...init })

export const put = <T>(f: FetchLike, path: string, body?: unknown, init?: RequestInit) =>
	json<T>(f, path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined, ...init })

export const del = <T>(f: FetchLike, path: string, init?: RequestInit) =>
	json<T>(f, path, { method: 'DELETE', ...init })
