import { normalizeCharacterUncap, type UncapData } from '$lib/utils/uncap'

export interface CharacterImportUncapData extends UncapData {
	rarity?: number
	special?: boolean
	ulbDate?: string
	transcendenceDate?: string
}

/**
 * Initializes an import from the parser's explicit uncap classification.
 * The rarity/transcendence fallback supports the old parser shape during a rolling deploy.
 */
export function normalizeCharacterImportUncap(data: CharacterImportUncapData) {
	const special =
		data.special ?? (data.rarity === 2 && data.ulb === undefined && data.transcendence === true)
	const normalized = normalizeCharacterUncap({ special, uncap: data })
	const ulbDate = data.ulbDate ?? (normalized.legacySpecialUlb ? data.transcendenceDate : undefined)

	return {
		...normalized,
		special,
		ulbDate,
		transcendenceDate: normalized.transcendence ? data.transcendenceDate : undefined
	}
}
