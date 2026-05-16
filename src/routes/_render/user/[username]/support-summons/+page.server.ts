/**
 * Internal SSR route for the support-summons share card. Only reachable via
 * the Playwright service (the _render layout guard enforces this). Loads the
 * profile + summons + parses optional transient fields from the query string.
 */

import { error } from '@sveltejs/kit'
import { userAdapter } from '$lib/api/adapters/user.adapter'
import type { SupportSummon } from '$lib/types/api/supportSummon'
import type { PageServerLoad } from './$types'

/** Caps that match the form-input maxlengths, applied as a defense in depth. */
const MAX_GBF_NAME = 30
const MAX_GBF_ID = 16
const MAX_TEAM_URL = 200

function takeString(value: string | null, max: number): string | undefined {
	if (!value) return undefined
	const trimmed = value.trim()
	if (!trimmed) return undefined
	return trimmed.slice(0, max)
}

export const load: PageServerLoad = async ({ params, url, fetch }) => {
	const username = params.username
	const userPromise = userAdapter.getInfo(username, { fetch })
	const summonsPromise: Promise<SupportSummon[]> = userAdapter
		.getSupportSummons(username, { fetch })
		.catch(() => [] as SupportSummon[])

	try {
		const [user, summons] = await Promise.all([userPromise, summonsPromise])
		return {
			user,
			summons,
			gbfName: takeString(url.searchParams.get('gbf_name'), MAX_GBF_NAME),
			gbfId: takeString(url.searchParams.get('gbf_id'), MAX_GBF_ID),
			teamUrl: takeString(url.searchParams.get('team_url'), MAX_TEAM_URL)
		}
	} catch (e: unknown) {
		const err = e as Record<string, unknown>
		const rawStatus = typeof err?.status === 'number' ? err.status : 502
		const safeStatus = rawStatus >= 400 && rawStatus <= 599 ? rawStatus : 502
		throw error(
			safeStatus,
			typeof err?.message === 'string' ? err.message : 'Failed to load share card'
		)
	}
}
