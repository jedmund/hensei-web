/**
 * The items that were rate-ups on the banner a spark was drawn on: the API's
 * GET /gacha/rate_ups for the spark's day and pool (the banners running that
 * day in Japan time). Without a date there's no banner to ask about.
 *
 * Best-effort: the marks are extra, so any failure is no marks.
 */
export async function fetchRateUps(
	fetch: typeof globalThis.fetch,
	base: string,
	date: string | null,
	pool: string | null,
	signal?: AbortSignal
): Promise<string[]> {
	if (!date) return []
	const query = new URLSearchParams({ date })
	if (pool) query.set('pool', pool)
	try {
		const response = await fetch(`${base}/gacha/rate_ups?${query}`, { signal })
		if (!response.ok) return []
		const body = (await response.json()) as { rate_ups?: unknown }
		return Array.isArray(body.rate_ups)
			? body.rate_ups.filter((id): id is string => typeof id === 'string')
			: []
	} catch {
		return []
	}
}
