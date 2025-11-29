import { userAdapter } from '../adapters/user.adapter'
import { optionalProps } from '$lib/utils/typeShims'

export interface UserUpdateParams {
	picture?: string | undefined
	element?: string | undefined
	gender?: number | undefined
	language?: string | undefined
	theme?: string | undefined
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
	update: async (userId: string, params: UserUpdateParams): Promise<UserResponse> => {
		// Transform flat params to nested UserInfo structure
		const updates: {
			gender?: number | undefined
			language?: string | undefined
			theme?: string | undefined
			avatar?: { picture?: string | undefined; element?: string | undefined } | undefined
		} = {}

		if (params.gender !== undefined) updates.gender = params.gender
		if (params.language !== undefined) updates.language = params.language
		if (params.theme !== undefined) updates.theme = params.theme

		if (params.picture !== undefined || params.element !== undefined) {
			updates.avatar = {}
			if (params.picture !== undefined) updates.avatar.picture = params.picture
			if (params.element !== undefined) updates.avatar.element = params.element
		}

		const result = await userAdapter.updateProfile(updates)
		return {
			id: result.id,
			username: result.username,
			avatar: result.avatar,
			gender: result.gender,
			language: result.language,
			theme: result.theme,
			role: result.role
		}
	}
}
