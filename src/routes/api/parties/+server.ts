import { json, type RequestHandler } from '@sveltejs/kit'
import { buildUrl } from '$lib/api/core'
import { PUBLIC_SIERO_API_URL } from '$env/static/public'

const API_BASE = new URL(PUBLIC_SIERO_API_URL || 'http://localhost:3000').href

/**
 * POST /api/parties - Create a new party
 * Proxies to Rails API with proper authentication
 */
export const POST: RequestHandler = async ({ request, fetch }) => {
  try {
    const body = await request.json()
    const editKey = request.headers.get('X-Edit-Key')

    // Forward to Rails API
    // The server-side fetch will automatically add Bearer token if user is authenticated
    const response = await fetch(buildUrl('/parties'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(editKey ? { 'X-Edit-Key': editKey } : {})
      },
      body: JSON.stringify(body)
    })

    const data = await response.json()

    // If creation was successful and returned an edit key, include it in response
    if (response.ok) {
      return json(data, { status: response.status })
    }

    // Forward error response
    return json(data, { status: response.status })
  } catch (error) {
    console.error('Error creating party:', error)
    return json(
      { error: 'Failed to create party' },
      { status: 500 }
    )
  }
}