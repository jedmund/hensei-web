// Artifact types based on Rails blueprints
// These define artifact reference data and instance types

import type { LocalizedName } from './entities'

// ============================================
// Reference Types (canonical game data)
// ============================================

/** Artifact rarity type */
export type ArtifactRarity = 'standard' | 'quirk'

/** Artifact skill group - determines which slot(s) can use the skill */
export type ArtifactSkillGroup = 'group_i' | 'group_ii' | 'group_iii'

/** Artifact skill polarity - positive or negative modifier */
export type ArtifactSkillPolarity = 'positive' | 'negative'

/** Cygames artifact score breakdown */
export interface ArtifactScore {
	attack: number
	defense: number
	special: number
	total: number
}

/**
 * Artifact reference data (ArtifactBlueprint)
 * Represents the canonical artifact type from the game
 */
export interface Artifact {
	id: string
	granblueId: string
	name: LocalizedName
	/** Fixed proficiency for standard artifacts, null for quirk */
	proficiency: number | null
	/** Artifact type: standard has skills, quirk does not */
	rarity: ArtifactRarity
	/** Release date if available */
	releaseDate?: string
}

/**
 * Artifact skill reference data (ArtifactSkillBlueprint)
 * Represents a skill modifier that can be applied to artifact slots
 */
export interface ArtifactSkill {
	id: string
	name: LocalizedName
	/** Game name used for import matching (may differ from display name) */
	gameName?: LocalizedName
	/** Which skill group this belongs to (determines valid slots) */
	skillGroup: ArtifactSkillGroup
	/** Numeric modifier identifier */
	modifier: number
	/** Whether this is a positive or negative modifier */
	polarity: ArtifactSkillPolarity
	/** Available strength values at each level (index 0-4 for levels 1-5) */
	baseValues: (number | null)[]
	/** Per-level scaling factor */
	growth?: number
	/** Display suffix for the value (e.g., "%", "ATK") */
	suffix: LocalizedName
	/** Cygames score category: 1=attack, 2=defense, 3=special */
	scoreCategory?: number
}

// ============================================
// Instance Types (user-owned data)
// ============================================

/**
 * Skill instance on an artifact
 * Represents a specific skill configuration with modifier, strength, and level
 */
export interface ArtifactSkillInstance {
	/** The skill modifier id */
	modifier: number
	/** The strength value (must be one of the skill's baseValues) */
	strength: number
	/** The skill level (1-5, affects total allocation) */
	level: number
}

/**
 * Collection artifact instance (CollectionArtifactBlueprint)
 * Represents an artifact in the user's inventory
 */
export interface CollectionArtifact {
	id: string
	/** Element (1-6: wind, fire, water, earth, dark, light) */
	element: number
	/** Artifact level (1-5 for standard, always 1 for quirk) */
	level: number
	/** User-assigned nickname (max 50 chars) */
	nickname?: string
	/** Which slot the user is targeting for rerolls (1-4) */
	rerollSlot?: number
	/** Proficiency (only set for quirk artifacts) */
	proficiency?: number
	/** Skills array (4 items for standard, empty for quirk) */
	skills: (ArtifactSkillInstance | null)[]
	/** Cygames artifact score (null for non-imported artifacts) */
	score: ArtifactScore | null
	/** Reference to the base artifact */
	artifact: Artifact
	createdAt: string
	updatedAt: string
}

/**
 * Grid artifact instance (GridArtifactBlueprint)
 * Represents an artifact equipped on a character in a party
 */
export interface GridArtifact {
	id: string
	/** Element (1-6: wind, fire, water, earth, dark, light) */
	element: number
	/** Artifact level (1-5 for standard, always 1 for quirk) */
	level: number
	/** Which slot the user is targeting for rerolls (1-4) */
	rerollSlot?: number
	/** Proficiency (only set for quirk artifacts) */
	proficiency?: number
	/** Skills array (4 items for standard, empty for quirk) */
	skills: (ArtifactSkillInstance | null)[]
	/** Cygames artifact score (null for non-imported artifacts) */
	score: ArtifactScore | null
	/** Reference to the base artifact */
	artifact: Artifact
	/** Reference to the source collection artifact if linked */
	collectionArtifactId?: string
	/** Whether the grid item is out of sync with its collection source */
	outOfSync?: boolean
}

// ============================================
// Input Types (for API requests)
// ============================================

/**
 * Input for creating/updating a collection artifact
 */
export interface CollectionArtifactInput {
	artifactId: string
	element: number
	level?: number
	nickname?: string
	rerollSlot?: number
	/** Only for quirk artifacts */
	proficiency?: number
	skill1?: ArtifactSkillInstance
	skill2?: ArtifactSkillInstance
	skill3?: ArtifactSkillInstance
	skill4?: ArtifactSkillInstance
}

/**
 * Input for creating a grid artifact
 */
export interface GridArtifactInput {
	partyId: string
	gridCharacterId: string
	artifactId: string
	element: number
	level?: number
	rerollSlot?: number
	/** Only for quirk artifacts */
	proficiency?: number
	skill1?: ArtifactSkillInstance
	skill2?: ArtifactSkillInstance
	skill3?: ArtifactSkillInstance
	skill4?: ArtifactSkillInstance
	/** Optional reference to source collection artifact for syncing */
	collectionArtifactId?: string
}

/**
 * Input for updating a grid artifact
 */
export interface GridArtifactUpdateInput {
	element?: number
	level?: number
	rerollSlot?: number
	/** Only for quirk artifacts */
	proficiency?: number
	skill1?: ArtifactSkillInstance
	skill2?: ArtifactSkillInstance
	skill3?: ArtifactSkillInstance
	skill4?: ArtifactSkillInstance
}

// ============================================
// Helper Types
// ============================================

/**
 * Union type for any artifact instance (collection or grid)
 */
export type ArtifactInstance = CollectionArtifact | GridArtifact

/**
 * Check if an artifact is a quirk type
 */
export function isQuirkArtifact(artifact: Artifact): boolean {
	return artifact.rarity === 'quirk'
}

/**
 * Check if an artifact instance is a collection artifact
 */
export function isCollectionArtifact(
	instance: ArtifactInstance
): instance is CollectionArtifact {
	return 'createdAt' in instance
}

/**
 * Get the skill group for a given slot number (1-4)
 * Slots 1-2 use group_i, slot 3 uses group_ii, slot 4 uses group_iii
 */
export function getSkillGroupForSlot(slot: number): ArtifactSkillGroup {
	if (slot <= 2) return 'group_i'
	if (slot === 3) return 'group_ii'
	return 'group_iii'
}

/**
 * Calculate the displayed skill value at a given level
 * Formula: baseValue + (growth × (level - 1))
 *
 * @param baseValue - The base strength value (rolled when skill is obtained)
 * @param growth - The per-level growth factor (default 0)
 * @param level - The skill level (1-5)
 * @returns The calculated display value that matches in-game display
 */
export function calculateSkillDisplayValue(
	baseValue: number,
	growth: number | undefined,
	level: number
): number {
	return baseValue + (growth ?? 0) * (level - 1)
}
