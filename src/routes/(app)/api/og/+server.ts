import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ url }) => {
	const target = url.searchParams.get('url')
	if (!target) {
		return json({ error: 'Missing url parameter' }, { status: 400 })
	}

	let parsed: URL
	try {
		parsed = new URL(target)
	} catch {
		return json({ error: 'Invalid URL' }, { status: 400 })
	}

	if (!['http:', 'https:'].includes(parsed.protocol)) {
		return json({ error: 'Invalid protocol' }, { status: 400 })
	}

	try {
		const controller = new AbortController()
		const timeout = setTimeout(() => controller.abort(), 5000)

		const res = await fetch(target, {
			signal: controller.signal,
			headers: { 'User-Agent': 'bot' }
		})
		clearTimeout(timeout)

		if (!res.ok) {
			return json({ error: 'Failed to fetch' }, { status: 502 })
		}

		const contentType = res.headers.get('content-type') ?? ''
		if (!contentType.includes('text/html')) {
			return json({ error: 'Not HTML' }, { status: 422 })
		}

		// Only read first 50KB to find OG tags
		const reader = res.body?.getReader()
		if (!reader) return json({ error: 'No body' }, { status: 502 })

		let html = ''
		const decoder = new TextDecoder()
		while (html.length < 50_000) {
			const { done, value } = await reader.read()
			if (done) break
			html += decoder.decode(value, { stream: true })
		}
		reader.cancel()

		const title = extractMeta(html, 'og:title') ?? extractTitle(html)
		const image = extractMeta(html, 'og:image')

		return json({ title: title ?? null, image: image ?? null })
	} catch {
		return json({ error: 'Fetch failed' }, { status: 502 })
	}
}

function extractMeta(html: string, property: string): string | undefined {
	// Match both property="og:x" and name="og:x" patterns
	const regex = new RegExp(
		`<meta[^>]*(?:property|name)=["']${property}["'][^>]*content=["']([^"']*)["']` +
			`|<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${property}["']`,
		'i'
	)
	const match = html.match(regex)
	return match?.[1] ?? match?.[2]
}

function extractTitle(html: string): string | undefined {
	const match = html.match(/<title[^>]*>([^<]*)<\/title>/i)
	return match?.[1]?.trim()
}
