import { getCharacterImage, getWeaponImage, getSummonImage } from './images'

export function getCharacterImageUrl(gbid?: string | number): string {
	// Use local square images for database tables
	return getCharacterImage(gbid, 'square', '01')
}

export function getWeaponImageUrl(gbid?: string | number): string {
	// Use local square images for database tables
	return getWeaponImage(gbid, 'square')
}

export function getSummonImageUrl(gbid?: string | number): string {
	// Use local square images for database tables
	return getSummonImage(gbid, 'square')
}

export function getDatabaseUrl(
	type: 'character' | 'weapon' | 'summon',
	granblueId: string,
	styleSwap?: boolean
): string {
	const base = `/database/${type}s/${granblueId}`
	return type === 'character' && styleSwap ? `${base}/style` : base
}

export function canAccessDatabase(role: number | undefined | null): boolean {
	return (role ?? 0) >= 7
}

export function getItemName(item: { name?: string | { en?: string; ja?: string } }): string {
	const name = item.name

	// Handle name object
	if (!name) return '—'
	if (typeof name === 'string') return name

	// Handle name.en/name.ja structure (API returns { en: "...", ja: "..." })
	return name.en || name.ja || '—'
}