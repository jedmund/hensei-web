// Collection types based on Rails CollectionCharacter/Weapon/Summon blueprints
// These define user-owned items with customizations

import type { Character, Weapon, Summon, JobAccessory, Awakening } from './entities'
import type { AugmentSkill, Befoulment } from './weaponStatModifier'

/**
 * Extended mastery modifier (used for rings and earrings)
 */
export interface ExtendedMastery {
	modifier: number
	strength: number
}

/**
 * Collection character from CollectionCharacterBlueprint
 * Represents a user's owned character with customizations
 */
export interface CollectionCharacter {
	id: string
	uncapLevel: number
	transcendenceStep: number
	perpetuity: boolean
	ring1: ExtendedMastery | null
	ring2: ExtendedMastery | null
	ring3: ExtendedMastery | null
	ring4: ExtendedMastery | null
	earring: ExtendedMastery | null
	awakening: {
		type: Awakening
		level: number
	} | null
	character: Character
	createdAt: string
	updatedAt: string
}

/**
 * Collection weapon from CollectionWeaponBlueprint
 * Represents a user's owned weapon with customizations
 */
export interface CollectionWeapon {
	id: string
	uncapLevel: number
	transcendenceStep: number
	element?: number // For element-changeable weapons
	/** AX skills with full modifier objects */
	ax?: AugmentSkill[]
	/** Befoulment for Odiant weapons */
	befoulment?: Befoulment
	awakening: {
		type: Awakening
		level: number
	} | null
	weaponKeys?: Array<{
		id: string
		name: { en: string; ja: string }
		slot: number
	}>
	weapon: Weapon
	createdAt: string
	updatedAt: string
}

/**
 * Collection summon from CollectionSummonBlueprint
 * Represents a user's owned summon with customizations
 */
export interface CollectionSummon {
	id: string
	uncapLevel: number
	transcendenceStep: number
	summon: Summon
	createdAt: string
	updatedAt: string
}

/**
 * Collection job accessory from CollectionJobAccessoryBlueprint
 */
export interface CollectionJobAccessory {
	id: string
	jobAccessory: JobAccessory
	createdAt: string
	updatedAt: string
}

/**
 * Full collection response (when no type filter is applied)
 */
export interface CollectionResponse {
	characters?: CollectionCharacter[]
	weapons?: CollectionWeapon[]
	summons?: CollectionSummon[]
	jobAccessories?: CollectionJobAccessory[]
}

/**
 * Input for creating a collection character
 */
export interface CollectionCharacterInput {
	characterId: string
	uncapLevel?: number
	transcendenceStep?: number
	perpetuity?: boolean
	awakeningId?: string
	awakeningLevel?: number
	ring1?: ExtendedMastery
	ring2?: ExtendedMastery
	ring3?: ExtendedMastery
	ring4?: ExtendedMastery
	earring?: ExtendedMastery
}

/**
 * Input for creating a collection weapon
 */
export interface CollectionWeaponInput {
	weaponId: string
	uncapLevel?: number
	transcendenceStep?: number
	element?: number
	weaponKey1Id?: string
	weaponKey2Id?: string
	weaponKey3Id?: string
	weaponKey4Id?: string
	awakeningId?: string
	awakeningLevel?: number
	// AX skills (uses FK IDs for API payload)
	axModifier1Id?: string
	axStrength1?: number
	axModifier2Id?: string
	axStrength2?: number
	// Befoulment (for Odiant weapons)
	befoulmentModifierId?: string
	befoulmentStrength?: number
	exorcismLevel?: number
}

/**
 * Input for creating a collection summon
 */
export interface CollectionSummonInput {
	summonId: string
	uncapLevel?: number
	transcendenceStep?: number
}

/**
 * Input for creating a collection job accessory
 */
export interface CollectionJobAccessoryInput {
	jobAccessoryId: string
}

/**
 * Sort options for collection items
 */
export type CollectionSortKey =
	| 'name_asc'
	| 'name_desc'
	| 'element_asc'
	| 'element_desc'
	| 'proficiency_asc'
	| 'proficiency_desc'

/**
 * Filters for listing collection items
 */
export interface CollectionFilters {
	element?: number[]
	rarity?: number[]
	race?: number[]
	proficiency?: number[]
	gender?: number[]
	series?: (string | number)[]
	sort?: CollectionSortKey
	page?: number
	limit?: number
}

/**
 * Collection privacy levels (matches Rails enum)
 */
export enum CollectionPrivacy {
	Everyone = 0,
	CrewOnly = 1,
	Private = 2
}

/**
 * Collection counts response
 */
export interface CollectionCounts {
	characters: number
	weapons: number
	summons: number
	artifacts: number
}
