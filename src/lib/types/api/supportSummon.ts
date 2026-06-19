import type { Summon } from '$lib/types/api/entities'

/**
 * Section name for a support-summon slot. Six element rows plus a misc row.
 * Source of truth: SupportSummon#section enum in hensei-api.
 */
export type SupportSummonSection = 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light' | 'misc'

/**
 * CollectionSummon — what the user owns. Embedded inside SupportSummon.
 * Slimmed to the fields needed for the support-summon grid (image + uncap art).
 */
export interface SupportSummonCollectionSummon {
	id: string
	uncapLevel: number
	transcendenceStep: number
	summon: Summon
}

/**
 * A single support-summon slot. `position` is 0–2 for element sections and
 * 0–3 for `misc`.
 */
export interface SupportSummon {
	id: string
	section: SupportSummonSection
	position: number
	required: boolean
	collectionSummon: SupportSummonCollectionSummon
	createdAt?: string
	updatedAt?: string
}

/**
 * Maximum number of slots per section. `misc` gets one extra (position 3).
 */
export const SUPPORT_SUMMON_SECTION_LIMITS: Record<SupportSummonSection, number> = {
	wind: 3,
	fire: 3,
	water: 3,
	earth: 3,
	dark: 3,
	light: 3,
	misc: 4
}

/** Section order — used to render rows top-to-bottom in the grid. */
export const SUPPORT_SUMMON_SECTIONS: readonly SupportSummonSection[] = [
	'wind',
	'fire',
	'water',
	'earth',
	'dark',
	'light',
	'misc'
] as const
