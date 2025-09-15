import type { PageServerLoad } from './$types'
import { PartyService } from '$lib/services/party.service'

export const load: PageServerLoad = async ({ params, fetch, locals }) => {
  console.log('[p/[id]/+page.server.ts] Loading with id:', params.id)

  // Get auth data directly from locals instead of parent()
  const authUserId = locals.session?.account?.userId

  // Try to fetch party data on the server
  const partyService = new PartyService(fetch)

  let partyFound = false
  let party = null
  let canEdit = false

  try {
    // Fetch the party
    party = await partyService.getByShortcode(params.id)
    console.log('[p/[id]] Successfully fetched party on server:', party.id, party.name)
    partyFound = true

    // Determine if user can edit
    console.log('[p/[id]] Auth user ID:', authUserId)
    console.log('[p/[id]] Party user ID:', party.user?.id)
    console.log('[p/[id]] Party user:', party.user)
    canEdit = authUserId ? party.user?.id === authUserId : false
    console.log('[p/[id]] Can edit?', canEdit)
  } catch (err) {
    console.log('[p/[id]] Error fetching party (expected for test ids):', err)
  }

  // Return party data with explicit serialization
  return {
    party: party ? structuredClone(party) : null,
    canEdit: Boolean(canEdit),
    partyFound,
    authUserId: authUserId || null
  }
}