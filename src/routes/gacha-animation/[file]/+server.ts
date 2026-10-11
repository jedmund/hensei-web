/**
 * The gacha simulator's draw animation files: GET /gacha-animation/<file>.
 * Serves the game's runtime, scene scripts and spritesheets from the image
 * bucket on our own origin, so the scripts load under `script-src 'self'`.
 * Only the files in ANIMATION_FILES are served; this isn't a general proxy.
 */

import { error } from '@sveltejs/kit'
import { getBasePath } from '$lib/utils/images'
import { ANIMATION_FILES, ANIMATION_PREFIX } from '$lib/gacha-animation/assets'
import type { RequestHandler } from './$types'

const CONTENT_TYPE: Record<string, string> = {
	js: 'text/javascript; charset=utf-8',
	png: 'image/png',
	jpg: 'image/jpeg'
}

// The files only change when the game's animation does, and then they get
// new names, so browsers and the CDN can keep them for a week
const CACHE_CONTROL = 'public, max-age=604800'

export const GET: RequestHandler = async ({ params, fetch }) => {
	const contentType = CONTENT_TYPE[params.file.split('.').pop() ?? '']
	if (!ANIMATION_FILES.has(params.file) || !contentType) throw error(404, 'Not found')

	// Locally the base path is /images (static/images); in production, the bucket
	const upstream = await fetch(`${getBasePath()}/${ANIMATION_PREFIX}/${params.file}`)
	if (!upstream.ok) throw error(upstream.status === 404 ? 404 : 502, 'Animation file unavailable')

	return new Response(upstream.body, {
		headers: {
			'Content-Type': contentType,
			'Cache-Control': CACHE_CONTROL,
			'X-Content-Type-Options': 'nosniff'
		}
	})
}
