// Core entity types based on Rails blueprints
// These are the base types for game objects

import type { WeaponSeriesRef } from './weaponSeries'
import type { CharacterSeriesRef } from './characterSeries'

export interface LocalizedName {
	en: string
	ja: string
}

// Weapon entity from WeaponBlueprint
export interface Weapon {
	id: string
	granblueId: string
	name: LocalizedName
	element?: number
	proficiency?: number
	rarity?: number
	maxLevel?: number
	maxSkillLevel?: number
	maxAwakeningLevel?: number | null
	maxExorcismLevel?: number | null
	/** Weapon series - object with slug/name/flags */
	series?: WeaponSeriesRef | null
	/** Variant override ID (via series.weaponSeriesVariantId from API) */
	weaponSeriesVariantId?: string | null
	limit?: boolean
	extra?: boolean
	hp?: {
		minHp: number
		maxHp: number
		maxHpFlb: number
		maxHpUlb: number
	}
	atk?: {
		minAtk: number
		maxAtk: number
		maxAtkFlb: number
		maxAtkUlb: number
	}
	uncap?: {
		flb: boolean
		ulb: boolean
		transcendence: boolean
		extraPrerequisite?: number | null
	}
	transcendenceHp?: number
	transcendenceAtk?: number
	// Available awakenings for this weapon (from :full view)
	awakenings?: Awakening[]
	// Database/admin fields
	releaseDate?: string
	flbDate?: string
	ulbDate?: string
	transcendenceDate?: string
	wiki?: { en?: string; ja?: string }
	gamewith?: string
	kamigame?: string
	nicknames?: { en?: string[]; ja?: string[] }
	recruits?: string | { id: string; granblueId: string; name: LocalizedName }
	// Forge chain fields (forgedFrom available in :grid and :full views)
	forgeOrder?: number | null
	forgedFrom?: { id: string; granblueId: string; name: LocalizedName } | null
	forgeChain?: Array<{
		id: string
		granblueId: string
		name: LocalizedName
		forgeOrder: number
	}> | null
	// Element variant IDs: maps element number (as string key) to variant game ID
	elementVariantIds?: Record<string, string> | null
	// Bullet slots for gun-proficiency weapons (array of bullet type integers)
	bulletSlots?: number[]
	/** Passive weapon skills, one entry per slot, each holding its evolving version tiers. */
	weaponSkills?: WeaponSkill[]
}

/** One uncap/transcendence tier of a weapon skill slot. */
export interface WeaponSkillVersion {
	name: LocalizedName
	description: LocalizedName
	/** Resolved CDN icon stem (internal element numbering), e.g. "skill_atk_4_4". */
	iconStem?: string | null
	ordinal: number
	/** Weapon level at which this version unlocks (null for the base version). */
	unlockLevel?: number | null
	/** Minimum uncap stars: 3 = base/MLB, 4 = FLB, 5 = ULB. */
	minUncap?: number | null
	/** Transcendence stage 0–5 (0 = not transcended). */
	transcendenceStage?: number | null
	skillModifier?: string | null
	skillSeries?: string | null
	skillSize?: string | null
	mainHandOnly?: boolean
	mcOnly?: boolean
	scalesWithSkillLevel?: boolean
	skill?: {
		id: string
		name: LocalizedName
		description: LocalizedName
		skillType?: string
	} | null
}

/** A weapon skill slot (one position) holding its evolving version tiers. */
export interface WeaponSkill {
	position: number
	versions: WeaponSkillVersion[]
}

// Character entity from CharacterBlueprint
export interface Character {
	id: string
	granblueId: string
	name: LocalizedName
	element?: number
	rarity?: number
	maxLevel?: number
	maxAwakeningLevel?: number
	uncap?: {
		flb: boolean
		transcendence: boolean
	}
	special?: boolean
	recruits?: string | null
	gender?: number
	race?: {
		race1: number
		race2: number
	}
	proficiency?: number[]
	hp?: {
		minHp?: number
		maxHp?: number
		maxHpFlb?: number
		maxHpTranscendence?: number
	}
	atk?: {
		minAtk?: number
		maxAtk?: number
		maxAtkFlb?: number
		maxAtkTranscendence?: number
	}
	// Other stats
	baseDa?: number
	baseTa?: number
	ougiRatio?: {
		ougiRatio?: number
		ougiRatioFlb?: number
	}
	// Available awakenings for this character (from :full view)
	awakenings?: Awakening[]
	// Database/admin fields
	characterId?: number[]
	season?: number
	series?: number[] | CharacterSeriesRef[]
	/** Human-readable series names (computed by API) */
	seriesNames?: string[]
	releaseDate?: string
	flbDate?: string
	transcendenceDate?: string
	wiki?: { en?: string; ja?: string }
	gamewith?: string
	kamigame?: string
	nicknames?: { en?: string[]; ja?: string[] }
	recruitedBy?: { id: string; granblueId: string; name: LocalizedName; promotionNames?: string[] }
	// Gender variant fields
	genderVariants?: boolean
	// Style swap fields
	styleSwap?: boolean
	styleName?: LocalizedName | null
	baseCharacter?: { id: string; granblueId: string; name: LocalizedName } | null
	styleSwaps?: Array<{
		id: string
		granblueId: string
		name: LocalizedName
		styleName: LocalizedName | null
	}>
	/** Parsed skill graph (from :full view) — slots, each with one or more versions */
	skills?: CharacterSkill[]
	/** Edges between skill versions (transform/option/form), referencing version ids */
	skillLinks?: CharacterSkillLink[]
}

// ===== Character skills (from CharacterBlueprint :full view) =====

/** How one skill version relates to another. */
export type CharacterSkillRelation = 'transforms_to' | 'option_of' | 'form_counterpart'

/** A status (buff/debuff/field effect) referenced by a skill effect. */
export interface SkillEffectStatus {
	id: string
	name: LocalizedName
	family?: string | null
	category?: string | null
	icon?: string | null
}

/** A single normalized effect within a skill version. */
export interface CharacterSkillEffect {
	id: string
	ordinal: number
	effectType: string
	target?: string | null
	amount?: string | null
	amountMax?: string | null
	durationValue?: number | null
	durationUnit?: string | null
	accuracy?: string | null
	stackingFrame?: string | null
	damagePct?: number | null
	hitCount?: number | null
	damageCap?: number | null
	damageElement?: string | null
	healPct?: number | null
	healCap?: number | null
	status?: SkillEffectStatus | null
}

/**
 * One incarnation of a skill slot. Two axes of variation share this shape:
 * progression (variantRole base/enhanced/uncap_upgrade/transcendence_upgrade)
 * and battle-state (transform_alt/option/form_alt/conditional).
 */
export interface CharacterSkillVersion {
	id: string
	name: LocalizedName
	description: LocalizedName
	icon?: string | null
	/** Game asset stem "{id}_{N}" for the icon at /icons/abilities/{gameIcon}.png */
	gameIcon?: string | null
	typeColor?: 'damage' | 'heal' | 'buff' | 'debuff' | 'field' | string | null
	cooldown?: number | null
	initialCooldown?: number | null
	durationValue?: number | null
	durationUnit?: string | null
	variantRole: string
	ordinal: number
	unlockLevel?: number | null
	enhanceLevels?: number[]
	minUncap?: number | null
	transcendenceStage?: number | null
	triggerType?: string | null
	triggerValue?: string | null
	cantRecast?: boolean
	oneTimeUse?: boolean
	autoActivate?: boolean
	mimicable?: boolean
	targetsAll?: boolean
	skillEffects?: CharacterSkillEffect[]
}

/** A skill slot (one ability/ougi/support position) holding its versions. */
export interface CharacterSkill {
	kind: 'ability' | 'ougi' | 'support' | string
	position: number
	versions: CharacterSkillVersion[]
}

/** A directed edge between two skill versions, by version id. */
export interface CharacterSkillLink {
	from: string
	to: string
	relation: CharacterSkillRelation
}

// Summon entity from SummonBlueprint
/** One parsed summon aura row (main or sub) at a given uncap/transcendence tier */
export interface SummonAura {
	id: string
	slot: 'main' | 'sub' | string
	target: string
	element?: string | null
	value?: number | null
	uncapLevel: number
	transcendenceStage: number
	condition?: string | null
	description: { en?: string | null; ja?: string | null }
}

export interface Summon {
	id: string
	granblueId: string
	name: LocalizedName
	element?: number
	rarity?: number
	maxLevel?: number
	uncap?: {
		flb: boolean
		ulb: boolean
		transcendence: boolean
	}
	subaura?: boolean
	/** Structured per-tier auras parsed from the wiki (the calculator's source) */
	summonAuras?: SummonAura[]
	limit?: boolean
	/** Whether this summon can be set as a support (friend) summon. Defaults
	 * to true server-side; only certain summons are explicitly excluded. */
	supportEligible?: boolean
	hp?: {
		minHp: number
		maxHp: number
		maxHpFlb: number
		maxHpUlb: number
	}
	atk?: {
		minAtk: number
		maxAtk: number
		maxAtkFlb: number
		maxAtkUlb: number
	}
	transcendenceHp?: number
	transcendenceAtk?: number
	series?: number
	// Database/admin fields
	releaseDate?: string
	flbDate?: string
	ulbDate?: string
	transcendenceDate?: string
	wiki?: { en?: string; ja?: string }
	gamewith?: string
	kamigame?: string
	nicknames?: { en?: string[]; ja?: string[] }
}

// Raw data response from separate /raw endpoint
export interface EntityRawData {
	wikiRaw: string | null
	gameRawEn: Record<string, unknown> | null
	gameRawJp: Record<string, unknown> | null
}

// Job entity from JobBlueprint
export interface Job {
	id: string
	granblueId: string
	name: LocalizedName
	row: number
	order: number
	proficiency: [number, number]
	masterLevel?: boolean // Whether this job supports master level
	ultimateMastery?: boolean // Whether this job supports ultimate mastery
	accessory?: boolean
	accessoryType?: number
	auxWeapon?: boolean // Whether this job requires an aux weapon in the first non-mainhand slot
}

// JobSkill entity from JobSkillBlueprint
export interface JobSkill {
	id: string
	name: LocalizedName
	slug: string
	color: number // Skill category (0-3 for colors, relates to skill type)
	main: boolean // Primary job skill
	sub: boolean // Sub-skill (transferable)
	emp: boolean // EMP skill
	base: boolean // Base skill (for advanced jobs)
	order: number // Display order
	job: Job // Associated job
	imageId?: string // Image filename (e.g., "2710_3")
	actionId?: number // Unique game ID
}

// JobAccessory entity from JobAccessoryBlueprint
export interface JobAccessory {
	id: string
	name: LocalizedName
	granblueId: string
	rarity: number
	releaseDate?: string
	accessoryType: number // 1 = Shield, 2 = Manatura
	job?: Job // Associated job (optional, included when available)
}

// Raid entity from RaidBlueprint
// Properties are camelCase because BaseAdapter transforms snake_case responses
export interface Raid {
	id: string
	slug: string
	name: LocalizedName
	level: number
	element: number
	extra: boolean
	playerCount?: number
	enemyId?: number
	summonId?: number
	questId?: number
	group?: RaidGroup
}

// RaidGroup entity from RaidGroupBlueprint
export interface RaidGroup {
	id: string
	name: LocalizedName
	section: string
	order: number
	difficulty: number
	hl: boolean
	extra: boolean
	guidebooks: boolean
	unlimited: boolean
}

// Awakening entity
export interface Awakening {
	id: string
	name: LocalizedName
	slug: string
	objectType?: string
	order?: number
}

// No awakening constant
export const NO_AWAKENING: Awakening = {
	id: '0',
	name: { en: 'No awakening', ja: '覚醒なし' },
	slug: 'no-awakening',
	order: 0
}

// WeaponKey entity (camelCased to match CamelCasedKeysDeep runtime data)
export interface WeaponKey {
	id: string
	granblueId: number
	name: LocalizedName
	slug: string
	series: number[]
	slot: number
	group: number
	order: number
}

// Bullet entity for gun-proficiency weapons
export interface Bullet {
	id: string
	granblueId: string
	slug: string
	name: LocalizedName
	effect: { en?: string; ja?: string }
	bulletType: number
	atk: number
	hitsAll: boolean
	order: number
}

// Bullet slot entry on a grid/collection weapon
export interface BulletLoadout {
	position: number
	bullet: Bullet
}

// Bullet type enum values
export const BULLET_TYPES: Record<number, string> = {
	1: 'Parabellum',
	2: 'Rifle',
	3: 'Cartridge',
	4: 'Aetherial'
} as const

// Guidebook entity
export interface Guidebook {
	id: string
	granblueId: number
	name: LocalizedName
	description?: LocalizedName
	slug: string
}

// User entity
export interface User {
	id: string
	username: string
	displayName?: string | null
	profilePicture?: string
	gender?: number
	role?: string
	createdAt?: string
	updatedAt?: string
	youtube?: string
	timezone?: string
	avatar?: {
		picture?: string
		element?: string
	}
}
