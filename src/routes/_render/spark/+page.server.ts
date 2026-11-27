/**
 * Internal SSR route for the spark maker's image. Only reachable via the
 * Playwright service (the _render layout guard enforces this).
 *
 * The public image endpoint resolves the spark and hands it over with a
 * one-shot prefetch token, so this route never calls the API.
 */

import { error } from '@sveltejs/kit'
import { consumePrefetch } from '$lib/server/renderPrefetch'
import type { SparkRenderData } from '$lib/types/spark'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ url }) => {
	const data = consumePrefetch<{
		spark: SparkRenderData
		theme: 'dark' | 'light'
		element: string | null
	}>(url.searchParams.get('prefetch'))
	if (!data) throw error(404, 'Not Found')
	return data
}
