import * as m from '$lib/paraglide/messages'
import type { AvatarUser } from '$lib/utils/avatar'

/** A run of byline text, linking somewhere when `href` is set (unlocalized) */
export interface BylineSegment {
	text: string
	href?: string
}

/**
 * Who a party is by, under its name: the creator, who it was remixed from,
 * and whose collection it uses. Shown as two overlapping avatars (`pair`),
 * the creator's avatar linking to their profile (`link`), or text alone
 * (`plain`, when the creator has no account). Names link to profiles, and
 * the remixed team ("bob's team") links to the original.
 */
export type Byline =
	| { kind: 'pair'; back: AvatarUser; front: AvatarUser; segments: BylineSegment[] }
	| { kind: 'link'; user: AvatarUser; segments: BylineSegment[] }
	| { kind: 'plain'; segments: BylineSegment[] }

export interface BylineParty {
	user?: AvatarUser | null | undefined
	sourceParty?: { shortcode?: string; user?: AvatarUser | null } | null | undefined
	collectionSourceUser?: AvatarUser | null | undefined
}

export function bylineText(segments: BylineSegment[]): string {
	return segments.map((s) => s.text).join('')
}

const OPEN = '\u0001'
const CLOSE = '\u0002'

/**
 * Renders a message with its parameters as segments, so each one can link
 * on its own wherever the locale puts it
 */
function fill<K extends string>(
	message: (params: Record<K, string>) => string,
	params: Record<K, BylineSegment>
): BylineSegment[] {
	const keys = Object.keys(params) as K[]
	const markers = Object.fromEntries(keys.map((key) => [key, `${OPEN}${key}${CLOSE}`]))
	return message(markers as Record<K, string>)
		.split(new RegExp(`${OPEN}(\\w+)${CLOSE}`))
		.map((part, i) => (i % 2 === 1 ? params[part as K] : { text: part }))
		.filter((segment) => segment.text)
}

function profile(user: AvatarUser): BylineSegment {
	const username = user.username ?? ''
	return { text: username, href: `/${username}` }
}

/** The first case that applies, in order; null without a creator or source */
export function partyByline({
	user,
	sourceParty,
	collectionSourceUser
}: BylineParty): Byline | null {
	const remixedFrom = sourceParty?.user?.username ? sourceParty.user : null
	const collectionOwner = collectionSourceUser?.username ? collectionSourceUser : null
	const original = (text: string): BylineSegment =>
		sourceParty?.shortcode ? { text, href: `/teams/${sourceParty.shortcode}` } : { text }

	if (user && remixedFrom && collectionOwner) {
		return {
			kind: 'pair',
			back: remixedFrom,
			front: user,
			segments: fill(m.party_remixed_with_collection, {
				username: profile(user),
				team: original(m.party_remixed_team({ otherUsername: remixedFrom.username ?? '' })),
				collectionUsername: profile(collectionOwner)
			})
		}
	}
	if (user && remixedFrom) {
		return {
			kind: 'pair',
			back: remixedFrom,
			front: user,
			segments: fill(m.party_remixed, {
				username: profile(user),
				team: original(m.party_remixed_team({ otherUsername: remixedFrom.username ?? '' }))
			})
		}
	}
	if (!user && remixedFrom) {
		return {
			kind: 'plain',
			segments: fill(m.party_remixed_anonymous, {
				team: original(m.party_remixed_team({ otherUsername: remixedFrom.username ?? '' }))
			})
		}
	}
	if (user && sourceParty) {
		return {
			kind: 'link',
			user,
			segments: fill(m.party_remixed_from_anonymous, {
				username: profile(user),
				team: original(m.party_remixed_anonymous_team())
			})
		}
	}
	if (!user && sourceParty) {
		return { kind: 'plain', segments: [original(m.party_remixed_anonymous_source())] }
	}
	if (user && collectionOwner && user.username === collectionOwner.username) {
		return {
			kind: 'link',
			user,
			segments: fill(m.party_using_own_collection, { username: profile(user) })
		}
	}
	if (user && collectionOwner) {
		// The collection's owner in front
		return {
			kind: 'pair',
			back: user,
			front: collectionOwner,
			segments: fill(m.party_using_others_collection, {
				username: profile(user),
				otherUsername: profile(collectionOwner)
			})
		}
	}
	if (user) return { kind: 'link', user, segments: [profile(user)] }
	return null
}
