import { userAdapter } from '../adapters/user.adapter'

export interface UserUpdateParams {
	username?: string | undefined
	displayName?: string | undefined
	picture?: string | undefined
	element?: string | undefined
	gender?: number | undefined
	language?: string | undefined
	theme?: string | undefined
	granblueId?: string | undefined
	showCrewGamertag?: boolean | undefined
	wikiProfile?: string | undefined
	youtube?: string | undefined
	collectionPrivacy?: number | undefined
	importWeapons?: boolean | undefined
	defaultImportVisibility?: number | undefined
	simplePortraits?: boolean | undefined
}

export interface UserResponse {
	id: string
	username: string
	displayName?: string
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
	wikiProfile?: string
	youtube?: string
	collectionPrivacy?: number
	importWeapons?: boolean
	defaultImportVisibility?: number
	simplePortraits?: boolean
}

export const users = {
	/**
	 * Update user settings
	 */
	update: async (userId: string, params: UserUpdateParams): Promise<UserResponse> => {
		// Pass flat params directly - backend expects flat picture/element fields
		const updates: {
			username?: string | undefined
			display_name?: string | undefined
			picture?: string | undefined
			element?: string | undefined
			gender?: number | undefined
			language?: string | undefined
			theme?: string | undefined
			granblue_id?: string | undefined
			show_gamertag?: boolean | undefined
			wiki_profile?: string | undefined
			youtube?: string | undefined
			collection_privacy?: number | undefined
			import_weapons?: boolean | undefined
			default_import_visibility?: number | undefined
			simple_portraits?: boolean | undefined
		} = {}

		if (params.username !== undefined) updates.username = params.username
		if (params.displayName !== undefined) updates.display_name = params.displayName
		if (params.picture !== undefined) updates.picture = params.picture
		if (params.element !== undefined) updates.element = params.element
		if (params.gender !== undefined) updates.gender = params.gender
		if (params.language !== undefined) updates.language = params.language
		if (params.theme !== undefined) updates.theme = params.theme
		if (params.granblueId !== undefined) updates.granblue_id = params.granblueId
		if (params.showCrewGamertag !== undefined) updates.show_gamertag = params.showCrewGamertag
		if (params.wikiProfile !== undefined) updates.wiki_profile = params.wikiProfile
		if (params.youtube !== undefined) updates.youtube = params.youtube
		if (params.collectionPrivacy !== undefined)
			updates.collection_privacy = params.collectionPrivacy
		if (params.importWeapons !== undefined) updates.import_weapons = params.importWeapons
		if (params.defaultImportVisibility !== undefined)
			updates.default_import_visibility = params.defaultImportVisibility
		if (params.simplePortraits !== undefined) updates.simple_portraits = params.simplePortraits

		const result = await userAdapter.updateProfile(updates)
		return {
			id: result.id,
			username: result.username,
			displayName: result.displayName ?? undefined,
			avatar: result.avatar,
			gender: result.gender,
			language: result.language,
			theme: result.theme,
			role: result.role,
			granblueId: result.granblueId,
			showCrewGamertag: result.showCrewGamertag,
			wikiProfile: result.wikiProfile,
			youtube: result.youtube,
			collectionPrivacy: result.collectionPrivacy,
			importWeapons: result.importWeapons,
			defaultImportVisibility: result.defaultImportVisibility,
			simplePortraits: result.simplePortraits
		}
	}
}
