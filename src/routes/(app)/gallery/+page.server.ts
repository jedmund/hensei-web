import type { PageServerLoad } from './$types'
import { homeAdapter } from '$lib/api/adapters/home.adapter'
import type { HomeResponse } from '$lib/types/api/home'

/** Slugs are lowercase words joined by - or _; anything else is ignored */
const SLUG = /^[a-z0-9][a-z0-9_-]{0,63}$/

export const load: PageServerLoad = async ({ url, fetch }) => {
	const param = url.searchParams.get('sticker')?.trim() ?? ''
	const sticker = SLUG.test(param) ? param : null

	let home: HomeResponse | null = null
	let loadError: string | null = null
	try {
		home = await homeAdapter.getHome(sticker ? { sticker } : {}, { fetch })
	} catch (e: unknown) {
		const err = e as Record<string, unknown>
		// status 0: the request was cancelled (the user navigated away)
		if (err?.status === 0) throw e
		loadError = typeof err?.message === 'string' ? err.message : 'Unknown error'
		console.error('[home/+page.server.ts] Failed to load home:', { status: err?.status, loadError })
	}

	return { home, sticker, loadError }
}
