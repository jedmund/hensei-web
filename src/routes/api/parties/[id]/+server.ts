import { json, type RequestHandler } from '@sveltejs/kit'
import { buildApiUrl, extractHeaders, handleApiError } from '../../_utils'

/**
 * PUT /api/parties/[id] - Update a party
 * DELETE /api/parties/[id] - Delete a party
 * Proxies to Rails API with proper authentication
 */

export const PUT: RequestHandler = async ({ request, params, fetch }) => {
  try {
    const { id } = params
    const body = await request.json()
    const headers = extractHeaders(request)

    // Forward to Rails API
    const response = await fetch(buildApiUrl(`/parties/${id}`), {
      method: 'PUT',
      headers,
      body: JSON.stringify(body)
    })

    const data = await response.json()
    return json(data, { status: response.status })
  } catch (error) {
    return json(handleApiError(error, 'update party'), { status: 500 })
  }
}

export const DELETE: RequestHandler = async ({ request, params, fetch }) => {
  try {
    const { id } = params
    const headers = extractHeaders(request)

    // Forward to Rails API
    const response = await fetch(buildApiUrl(`/parties/${id}`), {
      method: 'DELETE',
      headers
    })

    if (response.ok) {
      const data = await response.json()
      return json(data, { status: response.status })
    }

    // Handle error responses
    const errorData = await response.json().catch(() => ({}))
    return json(errorData, { status: response.status })
  } catch (error) {
    return json(handleApiError(error, 'delete party'), { status: 500 })
  }
}