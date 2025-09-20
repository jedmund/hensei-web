import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { buildApiUrl, extractHeaders, handleApiError } from '../../../../_utils'

export const POST: RequestHandler = async ({ params, request, fetch, cookies }) => {
	const { id: partyId } = params
	const body = await request.json()
	const editKey = request.headers.get('X-Edit-Key')

	// Forward the request to the Rails API
	const apiResponse = await fetch(
		buildApiUrl(`/parties/${partyId}/grid_weapons/swap`),
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${cookies.get('access_token')}`,
				...(editKey ? { 'X-Edit-Key': editKey } : {})
			},
			body: JSON.stringify(body)
		}
	)

	if (!apiResponse.ok) {
		const error = await apiResponse.json().catch(() => ({ error: 'Failed to swap weapons' }))
		return json(error, { status: apiResponse.status })
	}

	const data = await apiResponse.json()
	return json(data)
}