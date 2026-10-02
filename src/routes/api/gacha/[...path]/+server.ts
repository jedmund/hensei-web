import { error } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { getApiBaseUrl } from '$lib/api/adapters/config'

const proxy: RequestHandler = async ({ params, request, url, fetch }) => {
	const path = params.path
	const allowed =
		request.method === 'GET'
			? path === 'catalogue' || /^jobs\/[a-f0-9]{48}$/.test(path)
			: ['simulations', 'until', 'odds'].includes(path)
	if (!allowed) error(404)
	const response = await fetch(`${getApiBaseUrl()}/gacha/${path}${url.search}`, {
		method: request.method,
		headers: { 'Content-Type': 'application/json' },
		body: request.method === 'POST' ? await request.text() : undefined,
		signal: AbortSignal.timeout(60_000)
	})
	return new Response(response.body, {
		status: response.status,
		headers: {
			'Content-Type': 'application/json',
			'Cache-Control': 'no-store',
			...(response.headers.has('Retry-After')
				? { 'Retry-After': response.headers.get('Retry-After')! }
				: {})
		}
	})
}
export const GET = proxy
export const POST = proxy
