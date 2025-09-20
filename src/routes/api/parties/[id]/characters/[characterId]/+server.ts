import { json, type RequestHandler } from '@sveltejs/kit'
import { buildApiUrl, extractHeaders, handleApiError } from '../../../../_utils'

/**
 * PUT /api/parties/[id]/characters/[characterId] - Update character in party
 * Proxies to Rails API with proper authentication
 */

export const PUT: RequestHandler = async ({ request, params, fetch }) => {
  try {
    const body = await request.json()
    const editKey = request.headers.get('X-Edit-Key')

    // Transform to Rails API format
    const railsBody = {
      character: body
    }

    // Forward to Rails API
    const response = await fetch(buildApiUrl(`/grid_characters/${params.characterId}`), {
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
    console.error('Error updating character:', error)
    return json(
      { error: 'Failed to update character' },
      { status: 500 }
    )
  }
}