import type { FetchLike } from '$lib/api/core'
import { buildUrl, json } from '$lib/api/core'

export async function getJson<T>(path: string, fetchFn: FetchLike, init?: RequestInit): Promise<T> {
  const url = buildUrl(path)
  return json<T>(fetchFn, url, init)
}
