import { userAdapter } from '../adapters/user.adapter'

export interface UserUpdateParams {
	picture?: string | undefined
	element?: string | undefined
	gender?: number | undefined
	language?: string | undefined
	theme?: string | undefined
	granblueId?: string | undefined
	showCrewGamertag?: boolean | undefined
	showGranblueId?: boolean | undefined
	collectionPrivacy?: number | undefined
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
	granblueId?: string
	showCrewGamertag?: boolean
	showGranblueId?: boolean
	collectionPrivacy?: number
}

export const users = {
	/**
	 * Update user settings
	 */
	update: async (userId: string, params: UserUpdateParams): Promise<UserResponse> => {
		// Pass flat params directly - backend expects flat picture/element fields
		const updates: {
			picture?: string | undefined
			element?: string | undefined
			gender?: number | undefined
			language?: string | undefined
			theme?: string | undefined
			granblue_id?: string | undefined
			show_gamertag?: boolean | undefined
			show_granblue_id?: boolean | undefined
			collection_privacy?: number | undefined
		} = {}

		if (params.picture !== undefined) updates.picture = params.picture
		if (params.element !== undefined) updates.element = params.element
		if (params.gender !== undefined) updates.gender = params.gender
		if (params.language !== undefined) updates.language = params.language
		if (params.theme !== undefined) updates.theme = params.theme
		if (params.granblueId !== undefined) updates.granblue_id = params.granblueId
		if (params.showCrewGamertag !== undefined) updates.show_gamertag = params.showCrewGamertag
		if (params.showGranblueId !== undefined) updates.show_granblue_id = params.showGranblueId
		if (params.collectionPrivacy !== undefined) updates.collection_privacy = params.collectionPrivacy

		const result = await userAdapter.updateProfile(updates)
		return {
			id: result.id,
			username: result.username,
			avatar: result.avatar,
			gender: result.gender,
			language: result.language,
			theme: result.theme,
			role: result.role,
			granblueId: result.granblueId,
			showCrewGamertag: result.showCrewGamertag,
			showGranblueId: result.showGranblueId,
			collectionPrivacy: result.collectionPrivacy
		}
	}
}
