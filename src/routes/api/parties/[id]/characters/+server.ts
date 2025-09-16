import { json, type RequestHandler } from '@sveltejs/kit'
import { buildUrl } from '$lib/api/core'

/**
 * POST /api/parties/[id]/characters - Add character to party
 * DELETE /api/parties/[id]/characters - Remove character from party
 * Proxies to Rails API with proper authentication
 */

export const POST: RequestHandler = async ({ request, params, fetch }) => {
  try {
    const body = await request.json()
    const editKey = request.headers.get('X-Edit-Key')

    // Transform to Rails API format
    const railsBody = {
      character: {
        party_id: params.id,
        character_id: body.characterId,
        position: body.position,
        uncap_level: body.uncapLevel ?? 3,
        transcendence_step: body.transcendenceStep ?? 0,
        perpetuity: body.perpetuity ?? false
      }
    }

    // Forward to Rails API
    const response = await fetch(buildUrl('/characters'), {
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
    console.error('Error adding character:', error)
    return json(
      { error: 'Failed to add character' },
      { status: 500 }
    )
  }
}

export const DELETE: RequestHandler = async ({ request, params, fetch }) => {
  try {
    const body = await request.json()
    const editKey = request.headers.get('X-Edit-Key')

    // Forward to Rails API - use grid_characters endpoint with the ID
    const response = await fetch(buildUrl(`/grid_characters/${body.gridCharacterId}`), {
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
    console.error('Error removing character:', error)
    return json(
      { error: 'Failed to remove character' },
      { status: 500 }
    )
  }
}