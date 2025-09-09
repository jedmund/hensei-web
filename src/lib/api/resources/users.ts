import type { FetchLike } from '../core'
import { get } from '../core'

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
