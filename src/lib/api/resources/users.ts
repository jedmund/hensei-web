import type { FetchLike } from '../core'
import { get, buildUrl } from '../core'

export interface UserInfoResponse {
	id: string
	username: string
	language: string
	private: boolean
	gender: number
	theme: string
	role: number
	avatar: {
		picture: string
		element: string
	}
}

export const users = {
	info: (f: FetchLike, username: string, init?: RequestInit) =>
		get<UserInfoResponse>(f, `/users/info/${encodeURIComponent(username)}`, undefined, init)
}

export interface UserProfileResponse {
  profile: UserInfoResponse & { parties?: any[] }
  meta?: { count?: number; total_pages?: number; per_page?: number }
}

export async function profile(
  f: FetchLike,
  username: string,
  page?: number
): Promise<{ user: UserInfoResponse; items: any[]; page: number; total?: number; totalPages?: number; perPage?: number }> {
  const qs = page && page > 1 ? { page } : undefined
  const url = buildUrl(`/users/${encodeURIComponent(username)}`, qs as any)
  const resp = await f(url, { credentials: 'include' })
  if (!resp.ok) throw new Error(resp.statusText || 'Failed to load profile')
  const json = (await resp.json()) as UserProfileResponse
  const items = Array.isArray(json.profile?.parties) ? json.profile.parties : []
  return {
    user: json.profile as any,
    items,
    page: page || 1,
    total: json.meta?.count,
    totalPages: json.meta?.total_pages,
    perPage: json.meta?.per_page
  }
}
