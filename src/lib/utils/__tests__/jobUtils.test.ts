import { describe, it, expect, vi } from 'vitest'
import {
	Gender,
	getJobPortraitUrl,
	getJobFullImageUrl,
	getJobIconUrl,
	getJobWideImageUrl,
	getJobTierName,
	getJobTierOrder,
	jobSupportsAccessories,
	getJobSkillSlotCount,
	isSkillSlotAvailable,
	isSkillSlotLocked,
	getSkillCategoryName,
	getSkillCategoryColor,
	formatJobProficiency,
	isAdvancedJob,
	countSkillsByType,
	validateSkillConfiguration
} from '../jobUtils'
import type { Job, JobSkill } from '$lib/types/api/entities'
import type { JobSkillList } from '$lib/types/api/party'

vi.mock('$lib/api/adapters/config', () => ({
	getImageBaseUrl: vi.fn(() => '')
}))

vi.mock('../images', () => ({
	getGenericPlaceholder: vi.fn(() => '/images/placeholders/placeholder-weapon-grid.png')
}))

// ============================================================================
// Helpers
// ============================================================================

function makeJob(overrides: Partial<Job> = {}): Job {
	return {
		id: 'job-1',
		granblueId: '100101',
		name: { en: 'Dark Fencer', ja: 'ダークフェンサー' },
		row: 3,
		accessory: false,
		...overrides
	} as Job
}

function makeSkill(overrides: Partial<JobSkill> = {}): JobSkill {
	return {
		id: 'skill-1',
		name: { en: 'Test Skill', ja: 'テストスキル' },
		main: false,
		sub: false,
		emp: false,
		base: false,
		...overrides
	} as JobSkill
}

// ============================================================================
// URL Generators
// ============================================================================

describe('getJobPortraitUrl', () => {
	it('returns placeholder for undefined job', () => {
		expect(getJobPortraitUrl(undefined)).toContain('placeholder')
	})

	it('generates slug from job name with Gran (default)', () => {
		const job = makeJob({ name: { en: 'Dark Fencer', ja: '' } })
		const url = getJobPortraitUrl(job)
		expect(url).toBe('/images/job-portraits/dark-fencer_a.png')
	})

	it('uses gender suffix b for Djeeta', () => {
		const job = makeJob({ name: { en: 'Dark Fencer', ja: '' } })
		const url = getJobPortraitUrl(job, Gender.Djeeta)
		expect(url).toBe('/images/job-portraits/dark-fencer_b.png')
	})
})

describe('getJobFullImageUrl', () => {
	it('returns placeholder for undefined job', () => {
		expect(getJobFullImageUrl(undefined)).toContain('placeholder')
	})

	it('uses granblueId with gender suffix', () => {
		const job = makeJob({ granblueId: '100101' })
		expect(getJobFullImageUrl(job)).toBe('/images/job-zoom/100101_a.png')
		expect(getJobFullImageUrl(job, Gender.Djeeta)).toBe('/images/job-zoom/100101_b.png')
	})
})

describe('getJobIconUrl', () => {
	it('returns placeholder for undefined granblueId', () => {
		expect(getJobIconUrl(undefined)).toContain('placeholder')
	})

	it('generates icon path from granblueId', () => {
		expect(getJobIconUrl('100101')).toBe('/images/job-icons/100101.png')
	})
})

describe('getJobWideImageUrl', () => {
	it('returns placeholder for undefined job', () => {
		expect(getJobWideImageUrl(undefined)).toContain('placeholder')
	})

	it('uses jpg extension and granblueId', () => {
		const job = makeJob({ granblueId: '100101' })
		expect(getJobWideImageUrl(job)).toBe('/images/job-wide/100101_a.jpg')
	})
})

// ============================================================================
// Tier Functions
// ============================================================================

describe('getJobTierName', () => {
	it('maps numeric tiers', () => {
		expect(getJobTierName('1')).toBe('Class I')
		expect(getJobTierName('2')).toBe('Class II')
		expect(getJobTierName('3')).toBe('Class III')
		expect(getJobTierName('4')).toBe('Class IV')
		expect(getJobTierName('5')).toBe('Class V')
	})

	it('maps EX tiers', () => {
		expect(getJobTierName('ex')).toBe('EX')
		expect(getJobTierName('ex1')).toBe('EX')
		expect(getJobTierName('ex2')).toBe('EXII')
	})

	it('maps Origin tier', () => {
		expect(getJobTierName('o1')).toBe('Origin I')
	})

	it('handles numeric input', () => {
		expect(getJobTierName(1)).toBe('Class I')
	})

	it('falls back for unknown tiers', () => {
		expect(getJobTierName('unknown')).toBe('Class unknown')
	})
})

describe('getJobTierOrder', () => {
	it('returns correct sort order', () => {
		expect(getJobTierOrder('1')).toBe(1)
		expect(getJobTierOrder('4')).toBe(4)
		expect(getJobTierOrder('ex')).toBe(6)
		expect(getJobTierOrder('ex2')).toBe(7)
		expect(getJobTierOrder('o1')).toBe(8)
	})

	it('returns 99 for unknown tiers', () => {
		expect(getJobTierOrder('xyz')).toBe(99)
	})
})

// ============================================================================
// Job Properties
// ============================================================================

describe('jobSupportsAccessories', () => {
	it('returns true when accessory is true', () => {
		expect(jobSupportsAccessories(makeJob({ accessory: true }))).toBe(true)
	})

	it('returns false when accessory is false', () => {
		expect(jobSupportsAccessories(makeJob({ accessory: false }))).toBe(false)
	})

	it('returns false for undefined job', () => {
		expect(jobSupportsAccessories(undefined)).toBe(false)
	})
})

describe('getJobSkillSlotCount', () => {
	it('returns 0 for undefined job', () => {
		expect(getJobSkillSlotCount(undefined)).toBe(0)
	})

	it('returns 3 for row 1 jobs', () => {
		expect(getJobSkillSlotCount(makeJob({ row: 1 }))).toBe(3)
	})

	it('returns 4 for other rows', () => {
		expect(getJobSkillSlotCount(makeJob({ row: 3 }))).toBe(4)
		expect(getJobSkillSlotCount(makeJob({ row: 4 }))).toBe(4)
	})
})

describe('isSkillSlotAvailable', () => {
	it('returns false for undefined job', () => {
		expect(isSkillSlotAvailable(undefined, 0)).toBe(false)
	})

	it('returns true for valid slot within range', () => {
		expect(isSkillSlotAvailable(makeJob({ row: 4 }), 3)).toBe(true)
	})

	it('returns false for slot out of range', () => {
		expect(isSkillSlotAvailable(makeJob({ row: 1 }), 3)).toBe(false)
	})

	it('returns false for negative slot', () => {
		expect(isSkillSlotAvailable(makeJob(), -1)).toBe(false)
	})
})

describe('isSkillSlotLocked', () => {
	it('returns true for slot 0 with main skill', () => {
		const skills: JobSkillList = { 0: makeSkill({ main: true }) }
		expect(isSkillSlotLocked(0, makeJob(), skills)).toBe(true)
	})

	it('returns false for slot 0 without main skill', () => {
		const skills: JobSkillList = { 0: makeSkill({ sub: true }) }
		expect(isSkillSlotLocked(0, makeJob(), skills)).toBe(false)
	})

	it('returns false for non-zero slots', () => {
		const skills: JobSkillList = { 1: makeSkill({ main: true }) }
		expect(isSkillSlotLocked(1, makeJob(), skills)).toBe(false)
	})

	it('returns false when skills is undefined', () => {
		expect(isSkillSlotLocked(0, makeJob(), undefined)).toBe(false)
	})
})

// ============================================================================
// Skill Categories
// ============================================================================

describe('getSkillCategoryName', () => {
	it('returns Main for main skill', () => {
		expect(getSkillCategoryName(makeSkill({ main: true }))).toBe('Main')
	})

	it('returns Subskill for sub skill', () => {
		expect(getSkillCategoryName(makeSkill({ sub: true }))).toBe('Subskill')
	})

	it('returns EMP for emp skill', () => {
		expect(getSkillCategoryName(makeSkill({ emp: true }))).toBe('EMP')
	})

	it('returns Base for base skill', () => {
		expect(getSkillCategoryName(makeSkill({ base: true }))).toBe('Base')
	})

	it('returns Unknown when no type set', () => {
		expect(getSkillCategoryName(makeSkill())).toBe('Unknown')
	})
})

describe('getSkillCategoryColor', () => {
	it('returns correct color for each type', () => {
		expect(getSkillCategoryColor(makeSkill({ main: true }))).toContain('--skill-main')
		expect(getSkillCategoryColor(makeSkill({ sub: true }))).toContain('--skill-sub')
		expect(getSkillCategoryColor(makeSkill({ emp: true }))).toContain('--skill-emp')
		expect(getSkillCategoryColor(makeSkill({ base: true }))).toContain('--skill-base')
		expect(getSkillCategoryColor(makeSkill())).toContain('--skill-default')
	})
})

// ============================================================================
// Proficiency
// ============================================================================

describe('formatJobProficiency', () => {
	it('maps both proficiency values', () => {
		expect(formatJobProficiency([1, 2])).toEqual(['Sabre', 'Dagger'])
	})

	it('handles single proficiency', () => {
		expect(formatJobProficiency([1, 0])).toEqual(['Sabre'])
	})

	it('handles no proficiency', () => {
		expect(formatJobProficiency([0, 0])).toEqual([])
	})

	it('maps all weapon types', () => {
		expect(formatJobProficiency([7, 10])).toEqual(['Melee', 'Katana'])
	})
})

// ============================================================================
// Advanced Jobs
// ============================================================================

describe('isAdvancedJob', () => {
	it('returns true for row 4', () => {
		expect(isAdvancedJob(makeJob({ row: 4 }))).toBe(true)
	})

	it('returns true for row 5', () => {
		expect(isAdvancedJob(makeJob({ row: 5 }))).toBe(true)
	})

	it('returns true for ex2', () => {
		expect(isAdvancedJob(makeJob({ row: 'ex2' as any }))).toBe(true)
	})

	it('returns false for row 1', () => {
		expect(isAdvancedJob(makeJob({ row: 1 }))).toBe(false)
	})

	it('returns false for row 3', () => {
		expect(isAdvancedJob(makeJob({ row: 3 }))).toBe(false)
	})
})

// ============================================================================
// Skill Counting & Validation
// ============================================================================

describe('countSkillsByType', () => {
	it('counts skills by type', () => {
		const skills: JobSkillList = {
			0: makeSkill({ main: true }),
			1: makeSkill({ sub: true }),
			2: makeSkill({ emp: true }),
			3: makeSkill({ base: true })
		}
		expect(countSkillsByType(skills)).toEqual({ main: 1, sub: 1, emp: 1, base: 1 })
	})

	it('handles empty skills', () => {
		expect(countSkillsByType({} as JobSkillList)).toEqual({ main: 0, sub: 0, emp: 0, base: 0 })
	})

	it('counts multiple of same type', () => {
		const skills: JobSkillList = {
			0: makeSkill({ sub: true, id: 's-1' }),
			1: makeSkill({ sub: true, id: 's-2' }),
			2: makeSkill({ emp: true, id: 's-3' })
		}
		expect(countSkillsByType(skills)).toEqual({ main: 0, sub: 2, emp: 1, base: 0 })
	})
})

describe('validateSkillConfiguration', () => {
	it('returns valid for correct configuration', () => {
		const job = makeJob({ row: 4 })
		const skills: JobSkillList = {
			0: makeSkill({ main: true, id: 's-1' }),
			1: makeSkill({ sub: true, id: 's-2' }),
			2: makeSkill({ emp: true, id: 's-3' })
		}
		const result = validateSkillConfiguration(job, skills)
		expect(result.valid).toBe(true)
		expect(result.errors).toHaveLength(0)
	})

	it('errors when advanced job has >2 subskills', () => {
		const job = makeJob({ row: 4 })
		const skills: JobSkillList = {
			0: makeSkill({ sub: true, id: 's-1' }),
			1: makeSkill({ sub: true, id: 's-2' }),
			2: makeSkill({ sub: true, id: 's-3' })
		}
		const result = validateSkillConfiguration(job, skills)
		expect(result.valid).toBe(false)
		expect(result.errors).toContainEqual(expect.stringContaining('subskills'))
	})

	it('errors when advanced job has >2 EMP skills', () => {
		const job = makeJob({ row: 4 })
		const skills: JobSkillList = {
			0: makeSkill({ emp: true, id: 's-1' }),
			1: makeSkill({ emp: true, id: 's-2' }),
			2: makeSkill({ emp: true, id: 's-3' })
		}
		const result = validateSkillConfiguration(job, skills)
		expect(result.valid).toBe(false)
		expect(result.errors).toContainEqual(expect.stringContaining('EMP'))
	})

	it('errors when row 1 job has 4th skill', () => {
		const job = makeJob({ row: 1 })
		const skills: JobSkillList = {
			0: makeSkill({ id: 's-1' }),
			1: makeSkill({ id: 's-2' }),
			2: makeSkill({ id: 's-3' }),
			3: makeSkill({ id: 's-4' })
		}
		const result = validateSkillConfiguration(job, skills)
		expect(result.valid).toBe(false)
		expect(result.errors).toContainEqual(expect.stringContaining('Row I'))
	})

	it('errors on duplicate skills', () => {
		const job = makeJob({ row: 4 })
		const skills: JobSkillList = {
			0: makeSkill({ id: 'same-id', main: true }),
			1: makeSkill({ id: 'same-id', sub: true })
		}
		const result = validateSkillConfiguration(job, skills)
		expect(result.valid).toBe(false)
		expect(result.errors).toContainEqual(expect.stringContaining('Duplicate'))
	})

	it('allows >2 subskills for non-advanced jobs', () => {
		const job = makeJob({ row: 3 })
		const skills: JobSkillList = {
			0: makeSkill({ sub: true, id: 's-1' }),
			1: makeSkill({ sub: true, id: 's-2' }),
			2: makeSkill({ sub: true, id: 's-3' })
		}
		const result = validateSkillConfiguration(job, skills)
		expect(result.valid).toBe(true)
	})
})
