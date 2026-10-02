import type { Cookies } from '@sveltejs/kit'
import type { SocialProvider } from '$lib/auth/socialProviders'
import type { SocialErrorCode } from '$lib/auth/socialResult'
import { linkIdentity } from './api'
import { clearLinkTicket, getLinkTicket } from './cookies'

export type PendingLinkResult =
	| { linked: SocialProvider }
	| { provider: SocialProvider; error: SocialErrorCode }

/**
 * After a successful password login, links the provider that was waiting on
 * it ("log in with your password to link Discord"). The ticket is cleared
 * whatever happens, so a failed link doesn't follow the user around.
 *
 * `fetchFn` must send `token` as the Authorization header: the session
 * cookies set during this request aren't visible to handleFetch yet.
 */
export async function linkPendingIdentity(
	cookies: Cookies,
	fetchFn: typeof fetch,
	token: string
): Promise<PendingLinkResult | null> {
	const pending = getLinkTicket(cookies)
	if (!pending) return null
	clearLinkTicket(cookies)

	try {
		const result = await linkIdentity(fetchFn, { link_ticket: pending.ticket }, token)
		if (result.kind === 'linked') return { linked: result.provider }
		const error: SocialErrorCode =
			result.code === 'identity_taken' || result.code === 'provider_already_linked'
				? result.code
				: result.code === 'invalid_ticket'
					? 'expired'
					: 'failed'
		return { provider: pending.provider, error }
	} catch {
		return { provider: pending.provider, error: 'failed' }
	}
}
