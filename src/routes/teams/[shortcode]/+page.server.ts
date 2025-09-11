import type { PageServerLoad } from './$types'
import { error } from '@sveltejs/kit'
import { PartyService } from '$lib/services/party.service'

export const load: PageServerLoad = async ({ fetch, params, parent }) => {
  const { shortcode } = params
  const partyService = new PartyService(fetch)

  try {
    const party = await partyService.getByShortcode(shortcode)

    const parentData = await parent()
    const authUserId = (parentData as any)?.user?.id

    const canEditServer = partyService.computeEditability(
      party,
      authUserId,
      undefined,
      undefined
    )

    return {
      party,
      canEditServer: canEditServer.canEdit,
      authUserId
    }
  } catch (err: any) {
    console.error('Error loading party:', err)
    if (err?.issues) console.error('Validation errors:', err.issues)
    if (err.status === 404) throw error(404, 'Team not found')
    throw error(err.status || 500, err.message || 'Failed to load team')
  }
}

