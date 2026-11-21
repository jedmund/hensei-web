// Wonders (大事なもの): account-level items from the game. Types follow the
// GBF-282 API contract; the base adapter turns the API's snake_case into
// camelCase.

/** Either language can be missing (JA names the import hasn't seen); show the other. */
export interface WonderText {
	en: string | null
	ja: string | null
}

/** Element names as they appear in stat keys. */
export type WonderStatElement = 'fire' | 'water' | 'earth' | 'wind' | 'light' | 'dark'

/** Our stat keys, translated in the web app. Values are percentages. */
export type WonderStat =
	| `${WonderStatElement}_resistance`
	| `${WonderStatElement}_atk`
	| `dmg_amplify_vs_${WonderStatElement}`
	| 'def'
	| 'double_attack_rate'
	| 'triple_attack_rate'
	| 'healing_cap'
	| 'debuff_resistance'
	| 'debuff_success_rate'
	| 'skill_dmg'
	| 'ca_dmg'
	| 'na_dmg_cap'
	| 'skill_dmg_cap'
	| 'ca_dmg_cap'
	| 'dmg_amplify'

/**
 * - `leveled`: Crucible Seals and Yupei; bonuses add up level by level
 * - `scaling`: Symbolum Amicitiae; its bonus comes from the recruited count
 * - `fixed`: everything else; its effects are the catalogue text
 */
export type WonderKind = 'fixed' | 'leveled' | 'scaling'

export interface WonderCategory {
	id: string
	granblueId: string
	name: WonderText
	categoryType: number
	sortOrder: number
}

export interface WonderEffect {
	actionId: number
	position: number
	text: WonderText
}

export interface WonderLevelBonus {
	level: number
	stat: WonderStat
	value: number
}

export interface WonderEvolutionCap {
	evolution: number
	maxLevel: number
}

/** A catalogue Wonder (`GET /wonders`). */
export interface Wonder {
	id: string
	granblueId: string
	categoryId: string
	name: WonderText
	description: WonderText
	kind: WonderKind
	/** null applies to every element; Rings of Fate name theirs */
	element: number | null
	maxLevel: number | null
	maxEvolution: number | null
	battleRelevant: boolean
	hiddenInUniteAndFight: boolean
	sortOrder: number
	effects: WonderEffect[]
	levelBonuses: WonderLevelBonus[]
	evolutionCaps: WonderEvolutionCap[]
}

export interface WonderCatalogue {
	categories: WonderCategory[]
	wonders: Wonder[]
}

export interface WonderBonus {
	stat: WonderStat
	value: number
}

/**
 * A Wonder a user owns, or one snapshotted on a party: the same shape.
 * `active` is on collection rows only; party rows are always active.
 */
export interface OwnedWonder {
	id: string
	wonderId: string
	granblueId: string
	active?: boolean
	level: number | null
	evolution: number | null
	/** Symbolum's recruited-character count; stored, shown only as its bonus on teams */
	possession: number | null
	/** Image name without extension, e.g. `9008_20` */
	image: string
	/** Computed server-side. Empty for fixed Wonders. */
	bonuses: WonderBonus[]
}

/** The fields a Wonder's state is made of. Fields that don't apply to its kind are null. */
export interface WonderState {
	level: number | null
	evolution: number | null
	possession: number | null
}

/** `POST /collection/wonders` */
export interface CollectionWonderInput extends WonderState {
	wonderId: string
	active: boolean
}

/** `PUT /collection/wonders/:id`: everything but the Wonder. */
export type CollectionWonderUpdate = Omit<CollectionWonderInput, 'wonderId'>

/** One row of `PUT /parties/:id/wonders`. */
export interface PartyWonderInput extends WonderState {
	wonderId: string
}

export interface WonderImportSkipped {
	granblueId: string
	name: string
	reason: string
}

/** `POST /collection/wonders/import` */
export interface WonderImportResult {
	success: boolean
	created: number
	updated: number
	skipped: WonderImportSkipped[]
	warnings: unknown[]
}
