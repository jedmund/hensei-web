import { json, type RequestHandler } from '@sveltejs/kit'
import { buildApiUrl, extractHeaders, handleApiError } from '../../../_utils'

/**
 * POST /api/parties/[id]/grid_characters - Add character to party
 * Proxies to Rails API with proper authentication
 */

export const POST: RequestHandler = async ({ request, params, fetch, cookies }) => {
	try {
		const body = await request.json()
		const editKey = request.headers.get('X-Edit-Key')

		// Forward to Rails API
		const response = await fetch(buildApiUrl('/characters'), {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${cookies.get('access_token')}`,
				...(editKey ? { 'X-Edit-Key': editKey } : {})
			},
			body: JSON.stringify({
				character: {
					party_id: params.id,
					...body
				}
			})
		})

		const data = await response.json()
		return json(data, { status: response.status })
	} catch (error) {
		console.error('Error adding character:', error)
		return json(
			{ error: 'Failed to add character' },
			{ status: 500 }
		)
	}
}