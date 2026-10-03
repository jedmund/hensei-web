import {
	getCharacterImage,
	getSummonImage,
	getWeaponGridImage,
	getWeaponImage
} from '$lib/utils/images'
import type { CatalogueItem } from '$lib/types/gacha'

export type GachaItemKind = 'character' | 'weapon' | 'summon'

export function gachaItemKind(item: CatalogueItem): GachaItemKind {
	if (item.drawable_type === 'Summon') return 'summon'
	return item.recruits || item.category === 'characterWeapon' ? 'character' : 'weapon'
}

/** Name shown for an item: the recruited character for character weapons */
export function gachaItemName(item: CatalogueItem, locale: string): string {
	const names = gachaItemKind(item) === 'character' && item.recruits ? item.recruits : item.name
	return (locale === 'ja' ? names.ja : names.en) || names.en || item.name.en
}

/** Wide grid art, used for draw results */
export function gachaItemImage(
	item: CatalogueItem,
	art: 'weapon' | 'character' = 'weapon'
): string {
	if (art === 'character' && item.recruits?.granblue_id) {
		return getCharacterImage(item.recruits.granblue_id, 'grid', '01')
	}
	return item.drawable_type === 'Summon'
		? getSummonImage(item.granblue_id, 'grid')
		: getWeaponGridImage(item.granblue_id, item.element)
}

/** Square thumbnail, used in the picker */
export function gachaItemThumbnail(item: CatalogueItem): string {
	const kind = gachaItemKind(item)
	if (kind === 'summon') return getSummonImage(item.granblue_id, 'square')
	if (kind === 'character' && item.recruits?.granblue_id) {
		return getCharacterImage(item.recruits.granblue_id, 'square', '01')
	}
	return getWeaponImage(item.granblue_id, 'square', item.element === 0 ? 0 : undefined)
}
