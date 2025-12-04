/**
 * Artifact Validation Utilities
 *
 * Business rules for artifact validation:
 * 1. Skill Level Sum: sum of skill levels === artifact_level + 3
 * 2. No Duplicate Modifiers: Skills 1 & 2 cannot share the same modifier
 * 3. Quirk Artifacts: Always level 1, no skills, proficiency on instance
 * 4. Character Compatibility: Element + proficiency must match
 * 5. Slot→Group Mapping: 1-2 → group_i, 3 → group_ii, 4 → group_iii
 */

import type {
	ArtifactSkillInstance,
	ArtifactSkillGroup,
	GridArtifact,
	CollectionArtifact
} from '$lib/types/api/artifact'
import type { Character } from '$lib/types/api/entities'

/**
 * Element enum values
 * Used for filtering and matching
 */
export const ELEMENT_VALUES = {
	NULL: 0,
	WIND: 1,
	FIRE: 2,
	WATER: 3,
	EARTH: 4,
	DARK: 5,
	LIGHT: 6
} as const

/**
 * Maps skill slot (1-4) to skill group
 * Slots 1-2: group_i
 * Slot 3: group_ii
 * Slot 4: group_iii
 */
export function getSkillGroupForSlot(slot: number): ArtifactSkillGroup {
	const groupMap: Record<number, ArtifactSkillGroup> = {
		1: 'group_i',
		2: 'group_i',
		3: 'group_ii',
		4: 'group_iii'
	}
	const group = groupMap[slot]
	if (!group) {
		throw new Error(`Invalid slot number: ${slot}. Must be 1-4.`)
	}
	return group
}

/**
 * Validates that the sum of skill levels equals artifact_level + 3
 *
 * @param artifactLevel - The artifact's level (1-20)
 * @param skills - Array of skill instances (may contain nulls)
 * @returns true if valid, false otherwise
 */
export function validateSkillLevelSum(
	artifactLevel: number,
	skills: (ArtifactSkillInstance | null)[]
): boolean {
	const expectedSum = artifactLevel + 3
	const actualSum = skills.reduce((sum, skill) => sum + (skill?.level ?? 0), 0)
	return actualSum === expectedSum
}

/**
 * Gets the expected total skill level sum for a given artifact level
 */
export function getExpectedSkillLevelSum(artifactLevel: number): number {
	return artifactLevel + 3
}

/**
 * Gets the current total of all skill levels
 */
export function getCurrentSkillLevelSum(skills: (ArtifactSkillInstance | null)[]): number {
	return skills.reduce((sum, skill) => sum + (skill?.level ?? 0), 0)
}

/**
 * Validates that skills 1 & 2 don't have the same modifier
 *
 * @param skill1 - First skill instance
 * @param skill2 - Second skill instance
 * @returns true if valid (different modifiers or at least one null), false if duplicate
 */
export function validateDuplicateModifiers(
	skill1?: ArtifactSkillInstance | null,
	skill2?: ArtifactSkillInstance | null
): boolean {
	// If either skill is null/undefined, no conflict
	if (!skill1?.modifier || !skill2?.modifier) {
		return true
	}
	// Modifiers must be different
	return skill1.modifier !== skill2.modifier
}

/**
 * Checks if an artifact is compatible with a character
 *
 * Compatibility rules:
 * - Element must match character's element (unless artifact element is 0/null)
 * - Proficiency must match character's proficiency1 or proficiency2
 *
 * @param artifact - The artifact to check
 * @param character - The character to check against
 * @returns true if compatible, false otherwise
 */
export function isCompatibleWithCharacter(
	artifact: GridArtifact | CollectionArtifact,
	character: Character
): boolean {
	// Element check (0 is universal)
	if (artifact.element !== 0 && artifact.element !== character.element) {
		return false
	}

	// Proficiency check
	const artifactProficiency = getArtifactProficiency(artifact)
	if (artifactProficiency === undefined) {
		// No proficiency requirement
		return true
	}

	// Character proficiency is an array of up to 2 proficiencies
	const charProficiencies = character.proficiency ?? []

	if (!charProficiencies.includes(artifactProficiency)) {
		return false
	}

	return true
}

/**
 * Gets the proficiency value from an artifact
 * For standard artifacts, uses artifact.artifact.proficiency
 * For quirk artifacts, uses artifact.proficiency (instance level)
 */
export function getArtifactProficiency(
	artifact: GridArtifact | CollectionArtifact
): number | undefined {
	const isQuirk = artifact.artifact?.rarity === 'quirk'
	const proficiency = isQuirk ? artifact.proficiency : artifact.artifact?.proficiency
	return proficiency ?? undefined
}

/**
 * Checks if an artifact is a quirk artifact
 */
export function isQuirkArtifact(artifact: GridArtifact | CollectionArtifact): boolean {
	return artifact.artifact?.rarity === 'quirk'
}

/**
 * Validates all skills for an artifact
 *
 * @returns Object with validation results
 */
export function validateArtifactSkills(
	artifactLevel: number,
	skills: (ArtifactSkillInstance | null)[]
): {
	isValid: boolean
	levelSumValid: boolean
	noDuplicates: boolean
	currentLevelSum: number
	expectedLevelSum: number
	errors: string[]
} {
	const expectedLevelSum = getExpectedSkillLevelSum(artifactLevel)
	const currentLevelSum = getCurrentSkillLevelSum(skills)
	const levelSumValid = currentLevelSum === expectedLevelSum
	const noDuplicates = validateDuplicateModifiers(skills[0], skills[1])

	const errors: string[] = []
	if (!levelSumValid) {
		errors.push(
			`Skill level sum (${currentLevelSum}) must equal artifact level + 3 (${expectedLevelSum})`
		)
	}
	if (!noDuplicates) {
		errors.push('Skills 1 and 2 cannot have the same modifier')
	}

	return {
		isValid: levelSumValid && noDuplicates,
		levelSumValid,
		noDuplicates,
		currentLevelSum,
		expectedLevelSum,
		errors
	}
}

/**
 * Calculates available level points that can be distributed to skills
 * Based on: total = artifact_level + 3, distributed among 4 skills
 */
export function calculateAvailableLevelPoints(
	artifactLevel: number,
	skills: (ArtifactSkillInstance | null)[],
	excludeSlot?: number
): number {
	const total = getExpectedSkillLevelSum(artifactLevel)
	const used = skills.reduce((sum, skill, index) => {
		if (excludeSlot !== undefined && index === excludeSlot) {
			return sum
		}
		return sum + (skill?.level ?? 0)
	}, 0)
	return total - used
}
