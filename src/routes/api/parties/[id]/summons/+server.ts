import { json, type RequestHandler } from '@sveltejs/kit'
import { buildUrl } from '$lib/api/core'

/**
 * POST /api/parties/[id]/summons - Add summon to party
 * DELETE /api/parties/[id]/summons - Remove summon from party
 * Proxies to Rails API with proper authentication
 */

export const POST: RequestHandler = async ({ request, params, fetch }) => {
  try {
    const body = await request.json()
    const editKey = request.headers.get('X-Edit-Key')

    // Transform to Rails API format
    const railsBody = {
      summon: {
        party_id: params.id,
        summon_id: body.summonId,
        position: body.position,
        main: body.position === -1 || body.main,
        friend: body.position === 6 || body.friend,
        quick_summon: body.quickSummon ?? false,
        uncap_level: body.uncapLevel ?? 3,
        transcendence_step: body.transcendenceStep ?? 0
      }
    }

    // Forward to Rails API
    const response = await fetch(buildUrl('/summons'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(editKey ? { 'X-Edit-Key': editKey } : {})
      },
      body: JSON.stringify(railsBody)
    })

    const data = await response.json()
    return json(data, { status: response.status })
  } catch (error) {
    console.error('Error adding summon:', error)
    return json(
      { error: 'Failed to add summon' },
      { status: 500 }
    )
  }
}

export const DELETE: RequestHandler = async ({ request, params, fetch }) => {
  try {
    const body = await request.json()
    const editKey = request.headers.get('X-Edit-Key')

    // Forward to Rails API
    const response = await fetch(buildUrl('/summons'), {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(editKey ? { 'X-Edit-Key': editKey } : {})
      },
      body: JSON.stringify({ grid_summon_id: body.gridSummonId })
    })

    if (response.ok) {
      // DELETE might not return a body
      const text = await response.text()
      const data = text ? JSON.parse(text) : {}
      return json(data, { status: response.status })
    }

    const errorData = await response.json().catch(() => ({}))
    return json(errorData, { status: response.status })
  } catch (error) {
    console.error('Error removing summon:', error)
    return json(
      { error: 'Failed to remove summon' },
      { status: 500 }
    )
  }
}