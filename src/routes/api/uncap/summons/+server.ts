import { json, type RequestHandler } from '@sveltejs/kit'
import { buildApiUrl, extractHeaders, handleApiError } from '../../_utils'

export const POST: RequestHandler = async ({ request, fetch }) => {
	try {
		const body = await request.json()
		const editKey = request.headers.get('X-Edit-Key')

		// Forward to Rails API with automatic auth via handleFetch
		const response = await fetch(buildApiUrl('/summons/update_uncap'), {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...(editKey ? { 'X-Edit-Key': editKey } : {})
			},
			body: JSON.stringify(body)
		})

		if (!response.ok) {
			const error = await response.json().catch(() => ({ error: response.statusText }))
			return json(error, { status: response.status })
		}

		const data = await response.json()
		return json(data)
	} catch (error) {
		console.error('Error updating summon uncap:', error)
		return json({ error: 'Internal server error' }, { status: 500 })
	}
}