import {
	getCharacterDetailImage,
	getCharacterImage,
	getSummonDetailImage,
	getSummonImage,
	getWeaponBaseImage,
	getWeaponGridImage,
	getWeaponImage
} from '$lib/utils/images'
import type { CatalogueItem } from '$lib/types/gacha'

export type GachaItemKind = 'character' | 'weapon' | 'summon'

export function gachaItemKind(item: CatalogueItem): GachaItemKind {
	if (item.drawable_type === 'Summon') return 'summon'
	return item.recruits || item.category === 'characterWeapon' ? 'character' : 'weapon'
}

/**
 * Catalogue identity for a granblue_id, optionally of one rarity; empty when
 * the item isn't in the catalogue. Links use granblue_ids to stay short.
 */
export function gachaIdentityFor(
	items: CatalogueItem[],
	granblueId: string,
	rarity?: number
): string {
	if (!granblueId) return ''
	return (
		items.find(
			(item) => item.granblue_id === granblueId && (rarity === undefined || item.rarity === rarity)
		)?.identity ?? ''
	)
}

/** granblue_id for a catalogue identity; empty when it isn't in the catalogue */
export function gachaGranblueIdFor(items: CatalogueItem[], identity: string): string {
	return items.find((item) => item.identity === identity)?.granblue_id ?? ''
}

/** Name shown for an item: the recruited character for character weapons */
export function gachaItemName(item: CatalogueItem, locale: string): string {
	const names = gachaItemKind(item) === 'character' && item.recruits ? item.recruits : item.name
	return (locale === 'ja' ? names.ja : names.en) || names.en || item.name.en
}

// Characters show their uncapped (_02) art, or their base (_01) art in
// Umikin Mode; _01 is also the fallback when an _02 image is missing
const characterPose = (simplePortraits: boolean) => (simplePortraits ? '01' : '02')

/** Wide grid art, used for draw results */
export function gachaItemImage(
	item: CatalogueItem,
	art: 'weapon' | 'character' = 'weapon',
	simplePortraits = false
): string {
	if (art === 'character' && item.recruits?.granblue_id) {
		return getCharacterImage(item.recruits.granblue_id, 'grid', characterPose(simplePortraits))
	}
	return item.drawable_type === 'Summon'
		? getSummonImage(item.granblue_id, 'wide')
		: getWeaponGridImage(item.granblue_id, item.element)
}

/**
 * Large art for a featured item: the character's or summon's detail art, or
 * the weapon's base art for weapons without a character
 */
export function gachaItemDetailImage(item: CatalogueItem, simplePortraits = false): string {
	const kind = gachaItemKind(item)
	if (kind === 'summon') return getSummonDetailImage(item.granblue_id)
	if (kind === 'character' && item.recruits?.granblue_id) {
		return getCharacterDetailImage(item.recruits.granblue_id, characterPose(simplePortraits))
	}
	return getWeaponBaseImage(item.granblue_id)
}

/** Base (_01) detail art, the fallback for a character missing its _02 art */
export function gachaItemDetailFallbackImage(item: CatalogueItem): string | undefined {
	return gachaItemKind(item) === 'character' && item.recruits?.granblue_id
		? getCharacterDetailImage(item.recruits.granblue_id, '01')
		: undefined
}

/**
 * Fallback art when an item's result image is missing: summons' grid art, or
 * a character's base (_01) art
 */
export function gachaItemFallbackImage(
	item: CatalogueItem,
	art: 'weapon' | 'character' = 'weapon'
): string | undefined {
	if (item.drawable_type === 'Summon') return getSummonImage(item.granblue_id, 'grid')
	if (art === 'character' && item.recruits?.granblue_id) {
		return getCharacterImage(item.recruits.granblue_id, 'grid', '01')
	}
	return undefined
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
