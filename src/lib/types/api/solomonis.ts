// Evoking Solomonis types, from the API contract in
// docs/prds/evoking-solomonis-prd.md ("API contract"). The base adapter turns
// the API's snake_case into camelCase.

/** Either language can be missing; show the other in its place. */
export interface PartialLocalizedName {
	en: string | null
	ja: string | null
}

export type SolomonisKind = 'build' | 'run'
export type SolomonisOutcome = 'cleared' | 'failed'
export type SolomonisMidboss = 'banes_gate' | 'infernobringer' | 'beast_of_anathema'
export type SealState = 'start' | 'unsealed' | 'sealed'
export type GuideEffectRarity = 'normal' | 'rare' | 'unique' | 'cursed'
export type GuideEffectTargetType = 'race' | 'proficiency' | 'character'

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

/** `party.solomonis` in the full party view. Run-only fields are null on builds. */
export interface SolomonisExpedition {
	kind: SolomonisKind
	routeEvoker: Omit<RouteEvoker, 'zone'>
	zone: SolomonisZone
	pledgeLevel: number
	outcome: SolomonisOutcome | null
	bossesDefeated: number | null
	midboss: SolomonisMidboss | null
	expeditionLevel: number | null
	buildParty: { shortcode: string; name: string | null } | null
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
	kind: SolomonisKind
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

export interface SolomonisExpeditionInput {
	kind?: SolomonisKind
	routeEvokerId?: string
	pledgeLevel?: number
	outcome?: SolomonisOutcome | null
	bossesDefeated?: number | null
	midboss?: SolomonisMidboss | null
	expeditionLevel?: number | null
	buildPartyId?: string | null
	endedAt?: string | null
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
