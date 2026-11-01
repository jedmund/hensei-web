import type {
	CollectionCharacter,
	CollectionWeapon,
	CollectionSummon
} from '$lib/types/api/collection'
import type { AddItemResult } from '$lib/types/api/search'
import type { AccessibleCollectionMember } from '$lib/api/queries/crew.queries'
import { getAvatarSrc } from '$lib/utils/avatar'

/**
 * Extract the underlying entity from a collection item regardless of type
 */
export function getCollectionEntity(
	item: CollectionCharacter | CollectionWeapon | CollectionSummon
) {
	return 'character' in item ? item.character : 'weapon' in item ? item.weapon : item.summon
}

/**
 * Map a collection item to the unified AddItemResult format used by SearchContent
 */
export function mapCollectionToSearchResult(
	item: CollectionCharacter | CollectionWeapon | CollectionSummon
): AddItemResult {
	const entity = getCollectionEntity(item)
	return {
		id: entity.id,
		granblueId: entity.granblueId,
		name: entity.name,
		element: entity.element,
		rarity: entity.rarity,
		proficiency: 'proficiency' in entity ? entity.proficiency : undefined,
		collectionId: item.id,
		styleSwap: 'character' in item ? item.character.styleSwap : undefined,
		season: 'character' in item ? item.character.season : undefined,
		series: 'character' in item ? item.character.series : undefined
	}
}

/**
 * Client-side text filter for collection items by English or Japanese name
 */
export function filterCollectionByQuery<
	T extends CollectionCharacter | CollectionWeapon | CollectionSummon
>(items: T[], query: string): T[] {
	if (!query.trim()) return items
	const lowerQuery = query.toLowerCase()
	return items.filter((item) => {
		const entity = getCollectionEntity(item)
		const name = entity.name
		const nameEn = typeof name === 'string' ? name : name?.en || ''
		const nameJa = typeof name === 'string' ? '' : name?.ja || ''
		return nameEn.toLowerCase().includes(lowerQuery) || nameJa.toLowerCase().includes(lowerQuery)
	})
}

/** A user whose collection was linked from outside the crew (e.g. via a URL param) */
export interface ExternalCollectionUser {
	id: string
	username: string
	avatar?: { picture?: string } | undefined
}

export interface CollectionMemberOption {
	value: string
	label: string
	image?: string | undefined
	suffix?: string
}

export interface ResolvedMember {
	label: string
	image?: string | undefined
}

/**
 * Options for the collection member dropdown: the signed-in user first (marked
 * "You"), then the other crew members, then an external collection source if
 * it isn't already listed.
 */
export function buildMemberOptions(
	members: AccessibleCollectionMember[],
	authUserId: string | undefined,
	externalUser: ExternalCollectionUser | undefined
): CollectionMemberOption[] {
	const options: CollectionMemberOption[] = []

	if (authUserId) {
		const selfMember = members.find((m) => m.userId === authUserId)
		options.push({
			value: authUserId,
			label: selfMember?.username ?? 'You',
			image: selfMember ? getAvatarSrc(selfMember.avatarPicture) : undefined,
			suffix: 'You'
		})
	}

	for (const m of members) {
		if (m.userId !== authUserId) {
			options.push({
				value: m.userId,
				label: m.username,
				image: getAvatarSrc(m.avatarPicture)
			})
		}
	}

	if (externalUser && !options.some((o) => o.value === externalUser.id)) {
		options.push({
			value: externalUser.id,
			label: externalUser.username,
			image: getAvatarSrc(externalUser.avatar?.picture)
		})
	}

	return options
}

/** Name and avatar for a collection owner, looked up in the crew and the external user. */
export function resolveMember(
	userId: string | undefined,
	members: AccessibleCollectionMember[],
	authUserId: string | undefined,
	externalUser: ExternalCollectionUser | undefined
): ResolvedMember | undefined {
	if (!userId) return undefined
	if (userId === authUserId) {
		const self = members.find((m) => m.userId === authUserId)
		return {
			label: self?.username ?? 'You',
			image: self ? getAvatarSrc(self.avatarPicture) : undefined
		}
	}
	const member = members.find((m) => m.userId === userId)
	if (member) return { label: member.username, image: getAvatarSrc(member.avatarPicture) }
	if (externalUser && externalUser.id === userId) {
		return { label: externalUser.username, image: getAvatarSrc(externalUser.avatar?.picture) }
	}
	return undefined
}
