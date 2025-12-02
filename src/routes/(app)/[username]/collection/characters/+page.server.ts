import type { PageServerLoad } from './$types'
import { error } from '@sveltejs/kit'
import { collectionAdapter } from '$lib/api/adapters/collection.adapter'

export const load: PageServerLoad = async ({ parent }) => {
	const { user, isOwner } = await parent()

	try {
		// Fetch the user's public character collection
		const characters = await collectionAdapter.getPublicCharacters(user.id)

		return {
			characters,
			isOwner
		}
	} catch (e: any) {
		// 403 means collection is private
		if (e?.status === 403) {
			throw error(403, 'This collection is private')
		}
		throw error(e?.status || 502, e?.message || 'Failed to load collection')
	}
}
