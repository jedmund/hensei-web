import { getCharacterImage } from '$lib/utils/images/characters'
import { getWeaponImage } from '$lib/utils/images/weapons'
import { getSummonImage } from '$lib/utils/images/summons'
import type { EnrichedRosterItem, RosterItemRef } from '$lib/types/api/crew'

export type RosterItemType = RosterItemRef['type']

/** An item on the roster with what the page needs to show it */
export interface SelectedRosterItem {
	id: string
	granblueId: string
	name: string
	type: RosterItemType
	element?: number | undefined
	season?: number | null | undefined
}

export function toSelectedItems(items: EnrichedRosterItem[]): SelectedRosterItem[] {
	return items.map((item) => ({
		id: item.id,
		granblueId: item.granblueId,
		name: item.name,
		type: item.type,
		element: item.element,
		season: item.season
	}))
}

/** `items` with `item` appended, or null when it's already on the roster */
export function addRosterItem(items: RosterItemRef[], item: RosterItemRef): RosterItemRef[] | null {
	if (items.some((existing) => existing.id === item.id && existing.type === item.type)) return null
	return [...items, { id: item.id, type: item.type }]
}

/** `items` without the item matching both id and type */
export function removeRosterItem(
	items: RosterItemRef[],
	id: string,
	type: RosterItemType
): RosterItemRef[] {
	return items.filter((item) => !(item.id === id && item.type === type))
}

/** Square thumbnail for a roster column header */
export function getRosterItemImage(item: Pick<SelectedRosterItem, 'granblueId' | 'type'>): string {
	switch (item.type) {
		case 'Character':
			return getCharacterImage(item.granblueId, 'square', '01')
		case 'Weapon':
			return getWeaponImage(item.granblueId, 'square')
		case 'Summon':
			return getSummonImage(item.granblueId, 'square')
	}
}
