import { describe, it, expect } from 'vitest'
import {
	getSkillGroupForSlot,
	validateSkillLevelSum,
	getExpectedSkillLevelSum,
	getCurrentSkillLevelSum,
	validateDuplicateModifiers,
	isCompatibleWithCharacter,
	getArtifactProficiency,
	isQuirkArtifact,
	validateArtifactSkills,
	calculateAvailableLevelPoints
} from '../artifactValidation'
import type { ArtifactSkillInstance, GridArtifact, CollectionArtifact } from '$lib/types/api/artifact'
import type { Character } from '$lib/types/api/entities'

// ============================================================================
// Helpers
// ============================================================================

function makeSkill(modifier: number, level: number): ArtifactSkillInstance {
	return { modifier, strength: 10, level }
}

function makeArtifact(overrides: Partial<GridArtifact> = {}): GridArtifact {
	return {
		id: 'art-1',
		element: 1,
		level: 5,
		skills: [],
		grade: { letter: null, score: null, breakdown: null, lines: null, recommendation: null },
		artifact: {
			id: 'ref-1',
			granblueId: 'g-1',
			name: { en: 'Test', jp: 'テスト' },
			proficiency: 1,
			rarity: 'standard'
		},
		...overrides
	}
}

function makeCharacter(overrides: Partial<Character> = {}): Character {
	return {
		id: 'char-1',
		granblueId: 'c-1',
		name: { en: 'Test Char', jp: 'テスト' },
		element: 1,
		proficiency: [1],
		rarity: 3,
		...overrides
	} as Character
}

// ============================================================================
// getSkillGroupForSlot
// ============================================================================

describe('getSkillGroupForSlot', () => {
	it('maps slots 1-2 to group_i', () => {
		expect(getSkillGroupForSlot(1)).toBe('group_i')
		expect(getSkillGroupForSlot(2)).toBe('group_i')
	})

	it('maps slot 3 to group_ii', () => {
		expect(getSkillGroupForSlot(3)).toBe('group_ii')
	})

	it('maps slot 4 to group_iii', () => {
		expect(getSkillGroupForSlot(4)).toBe('group_iii')
	})

	it('throws for invalid slot', () => {
		expect(() => getSkillGroupForSlot(0)).toThrow('Invalid slot number')
		expect(() => getSkillGroupForSlot(5)).toThrow('Invalid slot number')
	})
})

// ============================================================================
// Skill level sum validation
// ============================================================================

describe('getExpectedSkillLevelSum', () => {
	it('returns artifactLevel + 3', () => {
		expect(getExpectedSkillLevelSum(1)).toBe(4)
		expect(getExpectedSkillLevelSum(5)).toBe(8)
		expect(getExpectedSkillLevelSum(20)).toBe(23)
	})
})

describe('getCurrentSkillLevelSum', () => {
	it('sums skill levels', () => {
		expect(getCurrentSkillLevelSum([makeSkill(1, 2), makeSkill(2, 3)])).toBe(5)
	})

	it('treats null skills as 0', () => {
		expect(getCurrentSkillLevelSum([makeSkill(1, 2), null, null, makeSkill(2, 1)])).toBe(3)
	})

	it('returns 0 for empty array', () => {
		expect(getCurrentSkillLevelSum([])).toBe(0)
	})
})

describe('validateSkillLevelSum', () => {
	it('returns true when sum matches expected', () => {
		const skills = [makeSkill(1, 2), makeSkill(2, 2), makeSkill(3, 2), makeSkill(4, 2)]
		expect(validateSkillLevelSum(5, skills)).toBe(true) // 8 === 5 + 3
	})

	it('returns false when sum is too low', () => {
		const skills = [makeSkill(1, 1), makeSkill(2, 1)]
		expect(validateSkillLevelSum(5, skills)).toBe(false) // 2 !== 8
	})

	it('returns false when sum is too high', () => {
		const skills = [makeSkill(1, 5), makeSkill(2, 5), makeSkill(3, 5), makeSkill(4, 5)]
		expect(validateSkillLevelSum(5, skills)).toBe(false) // 20 !== 8
	})
})

// ============================================================================
// Duplicate modifier validation
// ============================================================================

describe('validateDuplicateModifiers', () => {
	it('returns true when modifiers differ', () => {
		expect(validateDuplicateModifiers(makeSkill(1, 1), makeSkill(2, 1))).toBe(true)
	})

	it('returns false when modifiers match', () => {
		expect(validateDuplicateModifiers(makeSkill(1, 1), makeSkill(1, 1))).toBe(false)
	})

	it('returns true when either skill is null', () => {
		expect(validateDuplicateModifiers(makeSkill(1, 1), null)).toBe(true)
		expect(validateDuplicateModifiers(null, makeSkill(1, 1))).toBe(true)
	})

	it('returns true when both are null', () => {
		expect(validateDuplicateModifiers(null, null)).toBe(true)
	})

	it('returns true when either is undefined', () => {
		expect(validateDuplicateModifiers(undefined, makeSkill(1, 1))).toBe(true)
		expect(validateDuplicateModifiers(makeSkill(1, 1), undefined)).toBe(true)
	})
})

// ============================================================================
// Character compatibility
// ============================================================================

describe('isCompatibleWithCharacter', () => {
	it('matches when element and proficiency align', () => {
		const artifact = makeArtifact({ element: 1 })
		const character = makeCharacter({ element: 1, proficiency: [1] })
		expect(isCompatibleWithCharacter(artifact, character)).toBe(true)
	})

	it('rejects element mismatch', () => {
		const artifact = makeArtifact({ element: 2 })
		const character = makeCharacter({ element: 1, proficiency: [1] })
		expect(isCompatibleWithCharacter(artifact, character)).toBe(false)
	})

	it('element 0 is universal', () => {
		const artifact = makeArtifact({ element: 0 })
		const character = makeCharacter({ element: 5, proficiency: [1] })
		expect(isCompatibleWithCharacter(artifact, character)).toBe(true)
	})

	it('rejects proficiency mismatch', () => {
		const artifact = makeArtifact({ element: 1 })
		const character = makeCharacter({ element: 1, proficiency: [2, 3] })
		expect(isCompatibleWithCharacter(artifact, character)).toBe(false)
	})

	it('matches if character has artifact proficiency as second prof', () => {
		const artifact = makeArtifact({ element: 1 })
		const character = makeCharacter({ element: 1, proficiency: [2, 1] })
		expect(isCompatibleWithCharacter(artifact, character)).toBe(true)
	})

	it('compatible when artifact has no proficiency (quirk)', () => {
		const artifact = makeArtifact({
			element: 1,
			artifact: {
				id: 'ref-1',
				granblueId: 'g-1',
				name: { en: 'Quirk', jp: 'クーク' },
				proficiency: null,
				rarity: 'quirk'
			}
		})
		const character = makeCharacter({ element: 1 })
		expect(isCompatibleWithCharacter(artifact, character)).toBe(true)
	})
})

// ============================================================================
// getArtifactProficiency
// ============================================================================

describe('getArtifactProficiency', () => {
	it('returns artifact.artifact.proficiency for standard', () => {
		const artifact = makeArtifact()
		expect(getArtifactProficiency(artifact)).toBe(1)
	})

	it('returns instance proficiency for quirk', () => {
		const artifact = makeArtifact({
			proficiency: 3,
			artifact: {
				id: 'ref-1',
				granblueId: 'g-1',
				name: { en: 'Q', jp: 'Q' },
				proficiency: null,
				rarity: 'quirk'
			}
		})
		expect(getArtifactProficiency(artifact)).toBe(3)
	})

	it('returns undefined when no proficiency set', () => {
		const artifact = makeArtifact({
			artifact: {
				id: 'ref-1',
				granblueId: 'g-1',
				name: { en: 'Q', jp: 'Q' },
				proficiency: null,
				rarity: 'quirk'
			}
		})
		expect(getArtifactProficiency(artifact)).toBeUndefined()
	})
})

// ============================================================================
// isQuirkArtifact
// ============================================================================

describe('isQuirkArtifact', () => {
	it('returns true for quirk', () => {
		const artifact = makeArtifact({
			artifact: {
				id: 'r', granblueId: 'g', name: { en: '', jp: '' }, proficiency: null, rarity: 'quirk'
			}
		})
		expect(isQuirkArtifact(artifact)).toBe(true)
	})

	it('returns false for standard', () => {
		expect(isQuirkArtifact(makeArtifact())).toBe(false)
	})
})

// ============================================================================
// validateArtifactSkills
// ============================================================================

describe('validateArtifactSkills', () => {
	it('returns valid for correct level sum and no duplicates', () => {
		const skills = [makeSkill(1, 2), makeSkill(2, 2), makeSkill(3, 2), makeSkill(4, 2)]
		const result = validateArtifactSkills(5, skills)
		expect(result.isValid).toBe(true)
		expect(result.levelSumValid).toBe(true)
		expect(result.noDuplicates).toBe(true)
		expect(result.errors).toHaveLength(0)
	})

	it('returns invalid with level sum error', () => {
		const skills = [makeSkill(1, 1), makeSkill(2, 1), makeSkill(3, 1), makeSkill(4, 1)]
		const result = validateArtifactSkills(5, skills)
		expect(result.isValid).toBe(false)
		expect(result.levelSumValid).toBe(false)
		expect(result.errors).toContainEqual(expect.stringContaining('Skill level sum'))
	})

	it('returns invalid with duplicate error', () => {
		const skills = [makeSkill(1, 2), makeSkill(1, 2), makeSkill(3, 2), makeSkill(4, 2)]
		const result = validateArtifactSkills(5, skills)
		expect(result.isValid).toBe(false)
		expect(result.noDuplicates).toBe(false)
		expect(result.errors).toContainEqual(expect.stringContaining('same modifier'))
	})

	it('returns both errors when both fail', () => {
		const skills = [makeSkill(1, 1), makeSkill(1, 1)]
		const result = validateArtifactSkills(5, skills)
		expect(result.errors).toHaveLength(2)
	})
})

// ============================================================================
// calculateAvailableLevelPoints
// ============================================================================

describe('calculateAvailableLevelPoints', () => {
	it('returns total minus used', () => {
		const skills = [makeSkill(1, 2), makeSkill(2, 3), makeSkill(3, 1), null]
		expect(calculateAvailableLevelPoints(5, skills)).toBe(2) // 8 - 6
	})

	it('excludes specified slot from used', () => {
		const skills = [makeSkill(1, 2), makeSkill(2, 3), makeSkill(3, 1), null]
		// Exclude slot 1 (index 1, level 3) → used = 3, available = 8 - 3 = 5
		expect(calculateAvailableLevelPoints(5, skills, 1)).toBe(5)
	})

	it('returns full total for empty skills', () => {
		expect(calculateAvailableLevelPoints(5, [null, null, null, null])).toBe(8)
	})
})
