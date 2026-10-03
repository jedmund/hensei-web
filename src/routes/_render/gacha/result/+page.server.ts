/**
 * Internal SSR route for the gacha result share image. Only reachable via the
 * Playwright service (the _render layout guard enforces this).
 *
 * The public image endpoint runs the simulation and hands the result over
 * with a one-shot prefetch token, so this route never calls the API and the
 * render budget goes to loading images only.
 */

import { error } from '@sveltejs/kit'
import { consumePrefetch } from '$lib/server/renderPrefetch'
import type { GachaRenderData } from '$lib/types/gacha'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ url }) => {
	const data = consumePrefetch<GachaRenderData>(url.searchParams.get('prefetch'))
	if (!data) throw error(404, 'Not Found')
	return data
}
