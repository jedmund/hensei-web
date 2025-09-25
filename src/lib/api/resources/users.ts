import type { FetchLike } from '../core'
import { put } from '../core'

export interface UserUpdateParams {
	picture?: string
	element?: string
	gender?: number
	language?: string
	theme?: string
}

export interface UserResponse {
	id: string
	username: string
	avatar: {
		picture: string
		element: string
	}
	gender: number
	language: string
	theme: string
	role: number
}

export const users = {
	/**
	 * Update user settings
	 */
	update: (fetch: FetchLike, userId: string, params: UserUpdateParams) =>
		put<UserResponse>(fetch, `/users/${userId}`, { user: params })
}