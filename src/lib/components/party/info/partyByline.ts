import * as m from '$lib/paraglide/messages'
import type { AvatarUser } from '$lib/utils/avatar'

/**
 * Who a party is by, under its name: the creator, who it was remixed from,
 * and whose collection it uses. Shown as two overlapping avatars (`pair`),
 * the creator's avatar linking to their profile (`link`), or text alone
 * (`plain`, when the creator has no account).
 */
export type Byline =
	| { kind: 'pair'; back: AvatarUser; front: AvatarUser; text: string }
	| { kind: 'link'; user: AvatarUser; text: string }
	| { kind: 'plain'; text: string }

export interface BylineParty {
	user?: AvatarUser | null | undefined
	sourceParty?: { user?: AvatarUser | null } | null | undefined
	collectionSourceUser?: AvatarUser | null | undefined
}

/** The first case that applies, in order; null without a creator or source */
export function partyByline({
	user,
	sourceParty,
	collectionSourceUser
}: BylineParty): Byline | null {
	const username = user?.username ?? ''
	const remixedFrom = sourceParty?.user?.username ? sourceParty.user : null
	const collectionOwner = collectionSourceUser?.username ? collectionSourceUser : null

	if (user && remixedFrom && collectionOwner) {
		return {
			kind: 'pair',
			back: remixedFrom,
			front: user,
			text: m.party_remixed_with_collection({
				username,
				otherUsername: remixedFrom.username ?? '',
				collectionUsername: collectionOwner.username ?? ''
			})
		}
	}
	if (user && remixedFrom) {
		return {
			kind: 'pair',
			back: remixedFrom,
			front: user,
			text: m.party_remixed({ username, otherUsername: remixedFrom.username ?? '' })
		}
	}
	if (!user && remixedFrom) {
		return {
			kind: 'plain',
			text: m.party_remixed_anonymous({ otherUsername: remixedFrom.username ?? '' })
		}
	}
	if (user && sourceParty) {
		return { kind: 'link', user, text: m.party_remixed_from_anonymous({ username }) }
	}
	if (!user && sourceParty) {
		return { kind: 'plain', text: m.party_remixed_anonymous_source() }
	}
	if (user && collectionOwner && user.username === collectionOwner.username) {
		return { kind: 'link', user, text: m.party_using_own_collection({ username }) }
	}
	if (user && collectionOwner) {
		// The collection's owner in front
		return {
			kind: 'pair',
			back: user,
			front: collectionOwner,
			text: m.party_using_others_collection({
				username,
				otherUsername: collectionOwner.username ?? ''
			})
		}
	}
	if (user) return { kind: 'link', user, text: username }
	return null
}
