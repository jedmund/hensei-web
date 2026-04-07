import type { RequestHandler } from './$types'

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { message, stack, url } = (await request.json()) as {
			message?: string
			stack?: string
			url?: string
		}

		console.error('[client-error]', { message, stack, url })
	} catch {
		// Malformed request body — nothing to log
	}

	return new Response(null, { status: 204 })
}
