import { homeAdapter } from '$lib/api/adapters/home.adapter'
import type { HomeResponse } from '$lib/types/api/home'

export interface HomeLoad {
	home: HomeResponse | null
	loadError: string | null
}

/** Loads the Home feed for `/` and `/home` (see HOME_LAUNCHED) */
export async function loadHome(fetch: typeof globalThis.fetch): Promise<HomeLoad> {
	let home: HomeResponse | null = null
	let loadError: string | null = null
	try {
		home = await homeAdapter.getHome({ fetch })
	} catch (e: unknown) {
		const err = e as Record<string, unknown>
		// status 0: the request was cancelled (the user navigated away)
		if (err?.status === 0) throw e
		loadError = typeof err?.message === 'string' ? err.message : 'Unknown error'
		console.error('[server/home] Failed to load home:', { status: err?.status, loadError })
	}

	return { home, loadError }
}
