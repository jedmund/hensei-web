// Evoking Solomonis types, from the API contract in
// docs/prds/evoking-solomonis-prd.md ("API contract"). The base adapter turns
// the API's snake_case into camelCase.

/** Either language can be missing; show the other in its place. */
export interface PartialLocalizedName {
	en: string | null
	ja: string | null
}

/** How far an expedition got: the miasma closes twice, before and after the midboss (D19). */
export type SolomonisOutcome = 'miasma_1' | 'miasma_2' | 'cleared'
export type SealState = 'start' | 'unsealed' | 'sealed'
export type GuideEffectRarity = 'normal' | 'rare' | 'unique' | 'cursed'
export type GuideEffectTargetType = 'race' | 'proficiency' | 'character'
export type GuideEffectAvailability = 'global' | 'event' | 'character'

export interface SolomonisZone {
	id: string
	slug: string
	name: PartialLocalizedName
}

export interface RouteEvoker {
	id: string
	granblueId: string
	name: PartialLocalizedName
	element: number
	zone: SolomonisZone
}

export interface ArcarumBlessingLevel {
	id: string
	level: number
	description: PartialLocalizedName
	cost: number
	scintillas: number
}

export interface ArcarumBlessing {
	id: string
	slug: string
	arcanaNumber: number
	name: PartialLocalizedName
	released: boolean
	levels: ArcarumBlessingLevel[]
}

/** A blessing equipped on a party, at one level. */
export interface PartyBlessing {
	blessing: Pick<ArcarumBlessing, 'id' | 'slug' | 'arcanaNumber' | 'name'>
	levelId: string
	level: number
	cost: number
}

export interface GuideEffect {
	id: string
	/** The game's status_id. */
	granblueId: number
	rarity: GuideEffectRarity
	stackable: boolean
	/** May contain a `{value}` placeholder, filled from `displayValue`. */
	name: PartialLocalizedName
	iconCategory: number
	iconType: number
	targetType: GuideEffectTargetType | null
	/** In Hensei's numbering (race, proficiency) or character ID. */
	targetValues: number[]
	characterId: string | null
	/** From the wiki (D14); null when the wiki had no match. */
	availability: GuideEffectAvailability | null
	/** Wiki filter tags (D14); null when the wiki had no match. */
	typeTags: string[] | null
	effectTags: string[] | null
}

export interface GuidebookEntry {
	effect: GuideEffect
	count: number
	displayValue: string | null
	acquiredOrder: number | null
	inherited: boolean
	note: string | null
}

export interface SolomonisStats {
	battle?: number
	strong?: number
	terrifying?: number
	ruler?: number
	boss?: number
	event?: number
	healing?: number
	chest?: number
	teleporter?: number
	special?: number
	shopPurchases?: number
	pointsEarned?: number
}

/**
 * `party.solomonis` in the full party view. Outcome is null until set; the
 * end time, stats and report id come only from an imported report (D20).
 */
export interface SolomonisExpedition {
	routeEvoker: Omit<RouteEvoker, 'zone'>
	zone: SolomonisZone
	pledgeLevel: number
	outcome: SolomonisOutcome | null
	gameReportId: number | null
	/** ISO 8601, JST. */
	endedAt: string | null
	stats: SolomonisStats
	blessingCostLimit: number
	blessingCostTotal: number
	blessings: PartyBlessing[]
	guidebook: GuidebookEntry[]
}

/** `party.solomonis` in list views. */
export interface SolomonisSummary {
	routeEvokerId: string
	pledgeLevel: number
}

/** Fields added to grid items on Solomonis parties. */
export interface SolomonisGridWeaponFields {
	sealState: SealState | null
	unsealPriority: number | null
}
export type SolomonisGridSummonFields = SolomonisGridWeaponFields
export interface SolomonisGridCharacterFields {
	broughtByBlessing: boolean
}

// Write payloads

/** `party[solomonis]`: the only expedition fields the web app writes (D20). */
export interface SolomonisExpeditionInput {
	routeEvokerId?: string
	pledgeLevel?: number
	outcome?: SolomonisOutcome | null
}

export interface GuidebookEntryInput {
	guideEffectId: string
	count: number
	displayValue?: string | null
	acquiredOrder?: number | null
	inherited?: boolean
	note?: string | null
}

export interface UnsealPriorityItem {
	type: 'weapon' | 'summon'
	/** Grid item ID. */
	id: string
}
