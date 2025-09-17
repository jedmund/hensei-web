import { TeamElement } from '$lib/types/enums'

export function elementLabel(n?: number): string {
	switch (n) {
		case TeamElement.Wind:
			return 'Wind'
		case TeamElement.Fire:
			return 'Fire'
		case TeamElement.Water:
			return 'Water'
		case TeamElement.Earth:
			return 'Earth'
		case TeamElement.Dark:
			return 'Dark'
		case TeamElement.Light:
			return 'Light'
		case TeamElement.Null:
			return 'Null'
		default:
			return '—'
	}
}

export function elementClass(n?: number): string {
	switch (n) {
		case TeamElement.Wind:
			return 'element-wind'
		case TeamElement.Fire:
			return 'element-fire'
		case TeamElement.Water:
			return 'element-water'
		case TeamElement.Earth:
			return 'element-earth'
		case TeamElement.Dark:
			return 'element-dark'
		case TeamElement.Light:
			return 'element-light'
		default:
			return ''
	}
}

export function getCharacterImageUrl(gbid?: string | number): string {
	if (!gbid) return '/images/placeholders/placeholder-character-grid.png'
	return `https://prd-game-a1-granbluefantasy.akamaized.net/assets/img/sp/assets/npc/m/${gbid}_01.jpg`
}

export function getWeaponImageUrl(gbid?: string | number): string {
	if (!gbid) return '/images/placeholders/placeholder-weapon-grid.png'
	return `https://prd-game-a1-granbluefantasy.akamaized.net/assets/img/sp/assets/weapon/m/${gbid}.jpg`
}

export function getSummonImageUrl(gbid?: string | number): string {
	if (!gbid) return '/images/placeholders/placeholder-summon-main.png'
	return `https://prd-game-a1-granbluefantasy.akamaized.net/assets/img/sp/assets/summon/m/${gbid}.jpg`
}

export function getItemName(item: { name?: string | { en?: string; ja?: string } }): string {
	const name = item.name

	// Handle name object
	if (!name) return '—'
	if (typeof name === 'string') return name

	// Handle name.en/name.ja structure (API returns { en: "...", ja: "..." })
	return name.en || name.ja || '—'
}