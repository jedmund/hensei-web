import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// Video titles for the video tile, URL input and playlist dialogs. Fetched
// here so the CSP's connect-src doesn't need YouTube and viewers' browsers
// don't call it directly. The host is fixed; only the video id comes from the
// request. Rate-limited per IP in hooks.
const VIDEO_ID = /^[\w-]{11}$/

export const GET: RequestHandler = async ({ url }) => {
	const id = url.searchParams.get('id') ?? ''
	if (!VIDEO_ID.test(id)) {
		return json({ error: 'Invalid video id' }, { status: 400 })
	}

	const watchUrl = `https://www.youtube.com/watch?v=${id}`
	const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`

	let res: Response
	try {
		res = await fetch(oembedUrl, { signal: AbortSignal.timeout(5000) })
	} catch {
		return json({ error: 'Fetch failed' }, { status: 502 })
	}

	// YouTube answers 401 for private videos and 404 for missing ones.
	if (!res.ok) {
		const missing = res.status === 401 || res.status === 404
		return json(
			{ error: missing ? 'Video not found' : 'Fetch failed' },
			{ status: missing ? 404 : 502 }
		)
	}

	const data = (await res.json().catch(() => null)) as { title?: unknown } | null
	const title = typeof data?.title === 'string' ? data.title : null

	return json({ title }, { headers: { 'Cache-Control': 'public, max-age=86400' } })
}
