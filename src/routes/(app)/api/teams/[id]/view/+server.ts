import type { RequestHandler } from './$types'
import { getApiBaseUrl } from '$lib/api/adapters/config'
import { shouldRecordView } from '$lib/server/partyViews'

/**
 * Reports a view of a team page (`id` is the party UUID). Always answers 204:
 * whether a view counted is the API's business, and failures aren't worth
 * surfacing. `fetch` goes through handleFetch, which authenticates the call.
 */
export const POST: RequestHandler = async ({ params, request, fetch }) => {
	if (shouldRecordView(request, params.id)) {
		try {
			await fetch(`${getApiBaseUrl()}/parties/${params.id}/view`, { method: 'POST' })
		} catch {
			// A lost view isn't worth an error.
		}
	}
	return new Response(null, { status: 204 })
}
