export function getCharacterImageUrl(gbid?: string | number): string {
	if (!gbid) return '/images/placeholders/placeholder-character-grid.png'
	// Use local square images for database tables
	return `/images/character-square/${gbid}_01.jpg`
}

export function getWeaponImageUrl(gbid?: string | number): string {
	if (!gbid) return '/images/placeholders/placeholder-weapon-grid.png'
	// Use local square images for database tables
	return `/images/weapon-square/${gbid}.jpg`
}

export function getSummonImageUrl(gbid?: string | number): string {
	if (!gbid) return '/images/placeholders/placeholder-summon-main.png'
	// Use local square images for database tables
	return `/images/summon-square/${gbid}.jpg`
}

export function getItemName(item: { name?: string | { en?: string; ja?: string } }): string {
	const name = item.name

	// Handle name object
	if (!name) return '—'
	if (typeof name === 'string') return name

	// Handle name.en/name.ja structure (API returns { en: "...", ja: "..." })
	return name.en || name.ja || '—'
}