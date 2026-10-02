import type { RequestHandler } from './$types'
import { parseCspReports, summarizeViolation } from '$lib/server/cspReport'

// Receives Content-Security-Policy violation reports (the policy's report-uri)
// and logs one compact line each. Rate-limited per IP in the hooks. Not sent
// to Sentry: reports would count against its error quota.

const MAX_BODY_BYTES = 16 * 1024
const REPORT_TYPES = new Set(['application/csp-report', 'application/reports+json'])

export const POST: RequestHandler = async ({ request }) => {
	const type = (request.headers.get('content-type') ?? '').split(';')[0]?.trim().toLowerCase() ?? ''
	if (!REPORT_TYPES.has(type)) return new Response(null, { status: 415 })

	if (Number(request.headers.get('content-length')) > MAX_BODY_BYTES) {
		return new Response(null, { status: 413 })
	}
	const raw = await readCapped(request, MAX_BODY_BYTES)
	if (raw === null) return new Response(null, { status: 413 })

	let body: unknown
	try {
		body = JSON.parse(raw)
	} catch {
		return new Response(null, { status: 204 })
	}

	for (const violation of parseCspReports(body)) {
		const line = summarizeViolation(violation)
		if (line) console.warn(line)
	}
	return new Response(null, { status: 204 })
}

/** Reads the body as text, or returns null once it passes `limit` bytes. */
async function readCapped(request: Request, limit: number): Promise<string | null> {
	const reader = request.body?.getReader()
	if (!reader) return ''

	const decoder = new TextDecoder()
	let total = 0
	let text = ''
	for (;;) {
		const { done, value } = await reader.read()
		if (done) break
		total += value.byteLength
		if (total > limit) {
			await reader.cancel()
			return null
		}
		text += decoder.decode(value, { stream: true })
	}
	return text + decoder.decode()
}
