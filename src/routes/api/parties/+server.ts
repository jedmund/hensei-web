import { json, type RequestHandler } from '@sveltejs/kit'
import { buildApiUrl, extractHeaders, handleApiError } from '../_utils'

/**
 * POST /api/parties - Create a new party
 * Proxies to Rails API with proper authentication
 */
export const POST: RequestHandler = async ({ request, fetch }) => {
  try {
    const body = await request.json()
    const headers = extractHeaders(request)

    // Forward to Rails API
    // The server-side fetch will automatically add Bearer token if user is authenticated
    const response = await fetch(buildApiUrl('/parties'), {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    })

    const data = await response.json()
    return json(data, { status: response.status })
  } catch (error) {
    return json(handleApiError(error, 'create party'), { status: 500 })
  }
}