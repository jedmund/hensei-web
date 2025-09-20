import { json, type RequestHandler } from '@sveltejs/kit'
import { buildApiUrl, extractHeaders, handleApiError } from '../../../../_utils'

/**
 * PUT /api/parties/[id]/weapons/[weaponId] - Update weapon in party
 * Proxies to Rails API with proper authentication
 */

export const PUT: RequestHandler = async ({ request, params, fetch }) => {
  try {
    const body = await request.json()
    const editKey = request.headers.get('X-Edit-Key')

    // Transform to Rails API format
    const railsBody = {
      weapon: body
    }

    // Forward to Rails API
    const response = await fetch(buildApiUrl(`/grid_weapons/${params.weaponId}`), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(editKey ? { 'X-Edit-Key': editKey } : {})
      },
      body: JSON.stringify(railsBody)
    })

    const data = await response.json()
    return json(data, { status: response.status })
  } catch (error) {
    return json(handleApiError(error, 'updating weapon'), { status: 500 })
    return json(
      { error: 'Failed to update weapon' },
      { status: 500 }
    )
  }
}