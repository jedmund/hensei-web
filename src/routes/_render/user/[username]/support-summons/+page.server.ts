/**
 * Internal SSR route for the support-summons share card. Only reachable via
 * the Playwright service (the _render layout guard enforces this).
 *
 * Two data paths:
 *
 * 1. **Prefetched** — the public download endpoint (which has the user's
 *    session) pre-loads the profile + summons and stashes them under a
 *    one-shot token. The renderer's HTTP request to this route is
 *    unauthenticated, so for private profiles we MUST use the prefetched
 *    data — otherwise the API 403s the summons list and we'd render an
 *    empty grid for the owner's own download.
 *
 * 2. **Public fallback** — when there's no prefetch token (e.g. og:image
 *    flow), fetch via the renderer's own `event.fetch` against the
 *    `/users/info` + `/users/:username/support_summons` endpoints. Private
 *    profiles get an empty summons list, which is the right behavior for
 *    public previews.
 */

import { error } from '@sveltejs/kit'
import { userAdapter } from '$lib/api/adapters/user.adapter'
import { consumePrefetch } from '$lib/server/renderPrefetch'
import type { SupportSummon } from '$lib/types/api/supportSummon'
import type { UserInfo } from '$lib/api/adapters/user.adapter'
import type { PageServerLoad } from './$types'

const MAX_GBF_NAME = 30
const MAX_GBF_ID = 16
const MAX_TEAM_URL = 200

function takeString(value: string | null, max: number): string | undefined {
	if (!value) return undefined
	const trimmed = value.trim()
	if (!trimmed) return undefined
	return trimmed.slice(0, max)
}

interface Prefetched {
	user: UserInfo
	summons: SupportSummon[]
}

export const load: PageServerLoad = async ({ params, url, fetch }) => {
	const username = params.username
	const prefetched = consumePrefetch<Prefetched>(url.searchParams.get('prefetch'))

	try {
		let user: UserInfo
		let summons: SupportSummon[]

		if (prefetched && prefetched.user.username.toLowerCase() === username.toLowerCase()) {
			// Trust the prefetch: it was assembled on the authenticated side and
			// the username matches the route param.
			user = prefetched.user
			summons = prefetched.summons
		} else {
			const [fetchedUser, fetchedSummons] = await Promise.all([
				userAdapter.getInfo(username, { fetch }),
				userAdapter.getSupportSummons(username, { fetch }).catch(() => [] as SupportSummon[])
			])
			user = fetchedUser
			summons = fetchedSummons
		}

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
