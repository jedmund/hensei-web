import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { buildUrl } from '$lib/api/core'

export const POST: RequestHandler = async ({ params, request, fetch, cookies }) => {
	const { id: partyId } = params
	const body = await request.json()
	const editKey = request.headers.get('X-Edit-Key')

	// Forward the request to the Rails API
	const apiResponse = await fetch(
		buildUrl(`/parties/${partyId}/grid_summons/swap`),
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
		const error = await apiResponse.json().catch(() => ({ error: 'Failed to swap summons' }))
		return json(error, { status: apiResponse.status })
	}

	const data = await apiResponse.json()
	return json(data)
}