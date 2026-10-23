import type { PageServerLoad } from './$types'
import { stickerAdapter } from '$lib/api/adapters/sticker.adapter'
import { error, isHttpError, isRedirect } from '@sveltejs/kit'
import { requireEditor } from '$lib/auth/requireEditor'

export const load: PageServerLoad = async ({ parent, fetch }) => {
	try {
		const parentData = await parent()
		requireEditor(parentData, '/database')
		const stickers = await stickerAdapter.listStickers({ includeInactive: true }, { fetch })
		return { stickers, role: parentData.role }
	} catch (err) {
		if (isHttpError(err) || isRedirect(err)) throw err
		console.error('Failed to load stickers:', err)
		throw error(500, 'Failed to load stickers')
	}
}
