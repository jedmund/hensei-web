import { json, type RequestHandler } from '@sveltejs/kit'
import { buildUrl } from '$lib/api/core'

/**
 * POST /api/parties/[id]/weapons - Add weapon to party
 * DELETE /api/parties/[id]/weapons - Remove weapon from party
 * Proxies to Rails API with proper authentication
 */

export const POST: RequestHandler = async ({ request, params, fetch }) => {
  try {
    const body = await request.json()
    const editKey = request.headers.get('X-Edit-Key')

    // Transform to Rails API format
    const railsBody = {
      weapon: {
        party_id: params.id,
        weapon_id: body.weaponId,
        position: body.position,
        mainhand: body.position === -1 || body.mainhand,
        uncap_level: body.uncapLevel ?? 3,
        transcendence_step: body.transcendenceStep ?? 0,
        element: body.element
      }
    }

    // Forward to Rails API
    const response = await fetch(buildUrl('/weapons'), {
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
    console.error('Error adding weapon:', error)
    return json(
      { error: 'Failed to add weapon' },
      { status: 500 }
    )
  }
}

export const DELETE: RequestHandler = async ({ request, params, fetch }) => {
  try {
    const body = await request.json()
    const editKey = request.headers.get('X-Edit-Key')

    console.log('DELETE weapon request:', { body, params })

    // Forward to Rails API - use grid_weapons endpoint with the ID
    const response = await fetch(buildUrl(`/grid_weapons/${body.gridWeaponId}`), {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(editKey ? { 'X-Edit-Key': editKey } : {})
      }
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
    console.error('Error removing weapon:', error)
    return json(
      { error: 'Failed to remove weapon' },
      { status: 500 }
    )
  }
}