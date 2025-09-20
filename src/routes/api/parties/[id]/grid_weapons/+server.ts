import { json, type RequestHandler } from '@sveltejs/kit'
import { buildApiUrl, extractHeaders, handleApiError } from '../../../_utils'

/**
 * POST /api/parties/[id]/grid_weapons - Add weapon to party
 * Proxies to Rails API with proper authentication
 */

export const POST: RequestHandler = async ({ request, params, fetch, cookies }) => {
	try {
		const body = await request.json()
		const headers = {
			...extractHeaders(request),
			Authorization: `Bearer ${cookies.get('access_token')}`
		}

		// Forward to Rails API
		const response = await fetch(buildApiUrl('/weapons'), {
			method: 'POST',
			headers,
			body: JSON.stringify({
				weapon: {
					party_id: params.id,
					...body
				}
			})
		})

		const data = await response.json()
		return json(data, { status: response.status })
	} catch (error) {
		return json(handleApiError(error, 'add weapon'), { status: 500 })
	}
}