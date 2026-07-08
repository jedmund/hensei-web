/**
 * Weapon Stat Modifier Types
 *
 * Type definitions for the unified AX skill and Befoulment system.
 * These types represent modifiers from the weapon_stat_modifiers API endpoint.
 *
 * @module types/api/weaponStatModifier
 */

/**
 * Augment type enum for weapon series.
 * Determines whether a weapon series supports AX skills, befoulments, or neither.
 */
export type AugmentType = 'no_augment' | 'ax' | 'befoulment'

/**
 * WeaponStatModifier from the API.
 * Represents an AX skill or befoulment modifier definition.
 */
export interface WeaponStatModifier {
	/** Unique identifier */
	id: string
	/** URL-safe identifier (e.g., "ax_atk", "bef_atk_down") */
	slug: string
	/** English display name */
	nameEn: string
	/** Japanese display name */
	nameJp: string
	/** Category: "ax" for AX skills, "befoulment" for negative modifiers */
	category: 'ax' | 'befoulment'
	/** The stat this modifier affects (e.g., "atk", "def", "hp") */
	stat: string
	/** Polarity: 1 for buffs (positive), -1 for debuffs (negative) */
	polarity: 1 | -1
	/** Display suffix for values (e.g., "%") */
	suffix: string | null
	/** AX pool this skill rolls from: primary | secondary | extended | utility (null for befoulments) */
	axGroup?: 'primary' | 'secondary' | 'extended' | 'utility' | null
	/** Minimum valid strength value */
	baseMin: number
	/** Maximum valid strength value */
	baseMax: number
	/** Smallest exorcision reduction roll (befoulments; each level-up reduces by 1-3x this) */
	reductionStep?: number | null
}

/**
 * AX Skill with its modifier and strength value.
 * Used in GridWeapon and CollectionWeapon for weapons with AX skills.
 */
export interface AugmentSkill {
	/** The modifier definition */
	modifier: WeaponStatModifier
	/** The strength/value of this skill (e.g., 3.0 for 3% ATK) */
	strength: number
}

/**
 * Befoulment with modifier, strength, and exorcism level.
 * Used for Odiant weapons with negative stat modifiers.
 */
export interface Befoulment {
	/** The befoulment modifier definition */
	modifier: WeaponStatModifier
	/** The CURRENT (post-exorcision) value the game displays on the skill */
	strength: number
	/** Permeation (深度): the game's 1-6 severity depth of the base roll, unaffected by exorcision */
	permeation?: number | null
	/** Exorcism level (0-5; the game starts weapons at 1) - higher levels reduce the negative effect */
	exorcismLevel: number
}
