import { json, type RequestHandler } from '@sveltejs/kit'
import { buildUrl } from '$lib/api/core'

/**
 * PUT /api/parties/[id] - Update a party
 * DELETE /api/parties/[id] - Delete a party
 * Proxies to Rails API with proper authentication
 */

export const PUT: RequestHandler = async ({ request, params, fetch }) => {
  try {
    const { id } = params
    const body = await request.json()
    const editKey = request.headers.get('X-Edit-Key')

    // Forward to Rails API
    const response = await fetch(buildUrl(`/parties/${id}`), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(editKey ? { 'X-Edit-Key': editKey } : {})
      },
      body: JSON.stringify(body)
    })

    const data = await response.json()
    return json(data, { status: response.status })
  } catch (error) {
    console.error('Error updating party:', error)
    return json(
      { error: 'Failed to update party' },
      { status: 500 }
    )
  }
}

export const DELETE: RequestHandler = async ({ request, params, fetch }) => {
  try {
    const { id } = params
    const editKey = request.headers.get('X-Edit-Key')

    // Forward to Rails API
    const response = await fetch(buildUrl(`/parties/${id}`), {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(editKey ? { 'X-Edit-Key': editKey } : {})
      }
    })

    if (response.ok) {
      const data = await response.json()
      return json(data, { status: response.status })
    }

    // Handle error responses
    const errorData = await response.json().catch(() => ({}))
    return json(errorData, { status: response.status })
  } catch (error) {
    console.error('Error deleting party:', error)
    return json(
      { error: 'Failed to delete party' },
      { status: 500 }
    )
  }
}