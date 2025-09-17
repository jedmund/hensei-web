import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { buildUrl } from '$lib/api/core'

export const PUT: RequestHandler = async ({ params, request, fetch, cookies }) => {
	const { id: partyId, characterId } = params
	const body = await request.json()
	const editKey = request.headers.get('X-Edit-Key')

	// Forward the request to the Rails API
	const apiResponse = await fetch(
		buildUrl(`/parties/${partyId}/grid_characters/${characterId}/position`),
		{
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${cookies.get('access_token')}`,
				...(editKey ? { 'X-Edit-Key': editKey } : {})
			},
			body: JSON.stringify(body)
		}
	)

	if (!apiResponse.ok) {
		const error = await apiResponse.json().catch(() => ({ error: 'Failed to update character position' }))
		return json(error, { status: apiResponse.status })
	}

	const data = await apiResponse.json()
	return json(data)
}