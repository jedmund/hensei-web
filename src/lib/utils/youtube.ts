/**
 * A YouTube video's title, looked up through our own /api/youtube/oembed
 * route (the CSP doesn't let the browser call YouTube directly). Resolves to
 * null when the video can't be found or the request fails or is aborted.
 */
export async function fetchYoutubeTitle(id: string, signal?: AbortSignal): Promise<string | null> {
	try {
		const res = await fetch(`/api/youtube/oembed?id=${encodeURIComponent(id)}`, { signal })
		if (!res.ok) return null
		const data = (await res.json()) as { title?: unknown }
		return typeof data.title === 'string' ? data.title : null
	} catch {
		return null
	}
}
