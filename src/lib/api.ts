import { PUBLIC_API_BASE } from '$env/static/public'

export type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

export async function getJson<T>(path: string, fetchFn: FetchLike, init?: RequestInit): Promise<T> {
	const base = PUBLIC_API_BASE || ''
	const url = path.startsWith('http') ? path : `${base}${path}`
	const res = await fetchFn(url, { credentials: 'include', ...init })
	if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`)
	return res.json() as Promise<T>
}
