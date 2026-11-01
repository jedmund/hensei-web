import { getCharacterDetailImage, getCharacterImage } from '$lib/utils/images/characters'
import {
	getWeaponBaseImage,
	getWeaponGachaImage,
	getWeaponGridImage,
	getWeaponImage
} from '$lib/utils/images/weapons'
import {
	getSummonDetailImage,
	getSummonGachaImage,
	getSummonImage
} from '$lib/utils/images/summons'
import type { CatalogueItem } from '$lib/types/gacha'

export type GachaItemKind = 'character' | 'weapon' | 'summon'
export type GachaArt = 'character' | 'weapon'

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

/** Wide grid art, used for draw results; characters use their base (_01) art */
export function gachaItemImage(item: CatalogueItem, art: GachaArt = 'character'): string {
	if (art === 'character' && item.recruits?.granblue_id) {
		return getCharacterImage(item.recruits.granblue_id, 'grid', '01')
	}
	return item.drawable_type === 'Summon'
		? getSummonImage(item.granblue_id, 'wide')
		: getWeaponGridImage(item.granblue_id, item.element)
}

/**
 * The game's framed thumbnail of the drawn item itself, as its results screen
 * shows it: the weapon (never its character) or the summon
 */
export function gachaItemResultImage(item: CatalogueItem): string {
	return gachaItemImage(item, 'weapon')
}

/**
 * The other art for a character weapon: the weapon when showing characters,
 * the character when showing weapons. Shown on hover, and used when the
 * shown art is missing. Undefined for items that don't recruit anyone.
 */
export function gachaItemAlternateImage(item: CatalogueItem, art: GachaArt): string | undefined {
	if (!item.recruits?.granblue_id) return undefined
	return gachaItemImage(item, art === 'character' ? 'weapon' : 'character')
}

/** Fallback when an item's result image is missing */
export function gachaItemFallbackImage(item: CatalogueItem, art: GachaArt): string | undefined {
	if (item.drawable_type === 'Summon') return getSummonImage(item.granblue_id, 'grid')
	return gachaItemAlternateImage(item, art)
}

/**
 * Large art for a featured item: the character's base (_01) or summon's
 * detail art, or the weapon's base art for weapons without a character
 */
export function gachaItemDetailImage(item: CatalogueItem): string {
	const kind = gachaItemKind(item)
	if (kind === 'summon') return getSummonDetailImage(item.granblue_id)
	if (kind === 'character' && item.recruits?.granblue_id) {
		return getCharacterDetailImage(item.recruits.granblue_id, '01')
	}
	return getWeaponBaseImage(item.granblue_id)
}

/**
 * Gacha card art shown when an item is drawn: the weapon's or summon's own
 * art, never the recruited character's. Missing for some low-rarity items;
 * use {@link gachaItemCardFallbackImage} when it fails to load.
 */
export function gachaItemCardImage(item: CatalogueItem): string {
	return item.drawable_type === 'Summon'
		? getSummonGachaImage(item.granblue_id)
		: getWeaponGachaImage(item.granblue_id)
}

/** Fallback when an item's gacha card art is missing: weapon base or summon detail art */
export function gachaItemCardFallbackImage(item: CatalogueItem): string {
	return item.drawable_type === 'Summon'
		? getSummonDetailImage(item.granblue_id)
		: getWeaponBaseImage(item.granblue_id)
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
