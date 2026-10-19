import type { PageServerLoad } from './$types'
import { stickerAdapter } from '$lib/api/adapters/sticker.adapter'
import { error, isHttpError, isRedirect } from '@sveltejs/kit'
import { requireEditor } from '$lib/auth/requireEditor'

// The API has no single-sticker endpoint; the catalogue is small, so find it there.
export const load: PageServerLoad = async ({ params, parent, fetch }) => {
	try {
		const parentData = await parent()
		requireEditor(parentData, '/database/stickers')
		const stickers = await stickerAdapter.listStickers({ includeInactive: true }, { fetch })
		const sticker = stickers.find((s) => s.id === params.id)
		if (!sticker) throw error(404, 'Sticker not found')
		return { sticker, role: parentData.role }
	} catch (err) {
		if (isHttpError(err) || isRedirect(err)) throw err
		console.error('Failed to load sticker:', err)
		throw error(500, 'Failed to load sticker')
	}
}
