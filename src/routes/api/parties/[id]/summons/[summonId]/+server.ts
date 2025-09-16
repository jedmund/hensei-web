import { json, type RequestHandler } from '@sveltejs/kit'
import { buildUrl } from '$lib/api/core'

/**
 * PUT /api/parties/[id]/summons/[summonId] - Update summon in party
 * Proxies to Rails API with proper authentication
 */

export const PUT: RequestHandler = async ({ request, params, fetch }) => {
  try {
    const body = await request.json()
    const editKey = request.headers.get('X-Edit-Key')

    // Transform to Rails API format
    const railsBody = {
      summon: body
    }

    // Forward to Rails API
    const response = await fetch(buildUrl(`/grid_summons/${params.summonId}`), {
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
    console.error('Error updating summon:', error)
    return json(
      { error: 'Failed to update summon' },
      { status: 500 }
    )
  }
}