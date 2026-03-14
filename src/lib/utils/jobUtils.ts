/**
 * Job Utility Functions
 *
 * Helper functions for job-related operations including
 * image URL generation, tier naming, and validation.
 */

import type { Job, JobSkill } from '$lib/types/api/entities'
import type { JobSkillList } from '$lib/types/api/party'
import { getImageBaseUrl } from '$lib/api/adapters/config'
import { getGenericPlaceholder } from './images'
import { localizedName } from '$lib/utils/locale'
import * as m from '$lib/paraglide/messages'

/**
 * Gets the base path for images
 * Returns AWS S3/CDN URL if configured, otherwise local /images path
 */
function getBasePath(): string {
	const remoteUrl = getImageBaseUrl()
	return remoteUrl || '/images'
}

/**
 * Gender options for job portraits
 */
export enum Gender {
	Gran = 0, // Male protagonist (a)
	Djeeta = 1 // Female protagonist (b)
}

/**
 * Generate job portrait URL for protagonist slot (CharacterRep/CharacterUnit)
 * These are smaller portrait images stored in /static/images/job-portraits/
 */
export function getJobPortraitUrl(job: Job | undefined, gender: Gender = Gender.Gran): string {
	if (!job) {
		return getGenericPlaceholder()
	}

	// Convert job name to slug format (lowercase, spaces to hyphens)
	const slug = job.name.en.toLowerCase().replace(/\s+/g, '-')
	const genderSuffix = gender === Gender.Djeeta ? 'b' : 'a'

	return `${getBasePath()}/job-portraits/${slug}_${genderSuffix}.png`
}

/**
 * Generate full job image URL for JobSection component
 * These are full job images stored in /static/images/jobs/
 */
export function getJobFullImageUrl(job: Job | undefined, gender: Gender = Gender.Gran): string {
	if (!job) {
		return getGenericPlaceholder()
	}

	const genderSuffix = gender === Gender.Djeeta ? 'b' : 'a'

	return `${getBasePath()}/job-zoom/${job.granblueId}_${genderSuffix}.png`
}

/**
 * Generate job icon URL
 * Job icons are small square icons representing the job
 */
export function getJobIconUrl(granblueId: string | undefined): string {
	if (!granblueId) {
		return getGenericPlaceholder()
	}

	return `${getBasePath()}/job-icons/${granblueId}.png`
}

/**
 * Generate job wide banner image URL for JobItem component
 * These are wider banner-style images stored in /static/images/job-wide/
 */
export function getJobWideImageUrl(job: Job | undefined, gender: Gender = Gender.Gran): string {
	if (!job) {
		return getGenericPlaceholder()
	}

	const genderSuffix = gender === Gender.Djeeta ? 'b' : 'a'
	return `${getBasePath()}/job-wide/${job.granblueId}_${genderSuffix}.jpg`
}

/**
 * Get job tier display name
 * Converts internal row codes to user-friendly names
 */
export function getJobTierName(row: string | number): string {
	const tierMessages: Record<string, () => string> = {
		'1': m.job_tier_class_1,
		'2': m.job_tier_class_2,
		'3': m.job_tier_class_3,
		'4': m.job_tier_class_4,
		'5': m.job_tier_class_5,
		ex: m.job_tier_ex,
		ex1: m.job_tier_ex,
		ex2: m.job_tier_ex2,
		o1: m.job_tier_origin_1
	}

	const rowStr = row.toString().toLowerCase()
	const messageFn = tierMessages[rowStr]
	return messageFn ? messageFn() : `Class ${row}`
}

/**
 * Get job tier order for sorting
 * Returns a numeric value for sorting tiers
 */
export function getJobTierOrder(row: string | number): number {
	const tierOrder: Record<string, number> = {
		'1': 1,
		'2': 2,
		'3': 3,
		'4': 4,
		'5': 5,
		ex: 6,
		ex1: 6,
		ex2: 7,
		o1: 8
	}

	const rowStr = row.toString().toLowerCase()
	return tierOrder[rowStr] || 99
}

/**
 * Check if a job supports accessories
 */
export function jobSupportsAccessories(job: Job | undefined): boolean {
	return job?.accessory === true
}

/**
 * Get the number of skill slots for a job
 * Row 1 jobs have 3 slots, all others have 4
 */
export function getJobSkillSlotCount(job: Job | undefined): number {
	if (!job) return 0
	return job.row === 1 ? 3 : 4
}

/**
 * Check if a skill slot is available for a job
 */
export function isSkillSlotAvailable(job: Job | undefined, slot: number): boolean {
	if (!job) return false
	const slotCount = getJobSkillSlotCount(job)
	return slot >= 0 && slot < slotCount
}

/**
 * Check if a skill slot is locked (cannot be changed)
 * Slot 0 is locked when it contains a main skill
 */
export function isSkillSlotLocked(
	slot: number,
	job: Job | undefined,
	jobSkills: JobSkillList | undefined
): boolean {
	// Slot 0 is locked if it contains a main skill
	return slot === 0 && jobSkills?.['0']?.main === true
}

/**
 * Get skill category display name
 */
export function getSkillCategoryName(skill: JobSkill): string {
	if (skill.main) return m.skill_category_main()
	if (skill.sub) return m.skill_category_sub()
	if (skill.emp) return m.skill_category_emp()
	if (skill.base) return m.skill_category_base()
	return m.skill_category_unknown()
}

/**
 * Get skill category color
 * Returns CSS color variable name
 */
export function getSkillCategoryColor(skill: JobSkill): string {
	if (skill.main) return 'var(--skill-main, #ff6b6b)'
	if (skill.sub) return 'var(--skill-sub, #4ecdc4)'
	if (skill.emp) return 'var(--skill-emp, #45b7d1)'
	if (skill.base) return 'var(--skill-base, #96ceb4)'
	return 'var(--skill-default, #888)'
}

/**
 * Format job proficiency for display
 * Converts proficiency numbers to weapon type names
 */
export function formatJobProficiency(proficiency: [number, number]): string[] {
	const weaponTypes: Record<number, () => string> = {
		1: m.proficiency_sabre,
		2: m.proficiency_dagger,
		3: m.proficiency_axe,
		4: m.proficiency_spear,
		5: m.proficiency_bow,
		6: m.proficiency_staff,
		7: m.proficiency_melee,
		8: m.proficiency_harp,
		9: m.proficiency_gun,
		10: m.proficiency_katana
	}

	const result: string[] = []
	const type1 = proficiency[0] ? weaponTypes[proficiency[0]]?.() : undefined
	if (type1) {
		result.push(type1)
	}
	const type2 = proficiency[1] ? weaponTypes[proficiency[1]]?.() : undefined
	if (type2) {
		result.push(type2)
	}

	return result
}

/**
 * Check if a job is an advanced job (Row IV, V, or Extra II)
 */
export function isAdvancedJob(job: Job): boolean {
	const row = job.row.toString().toLowerCase()
	return row === '4' || row === '5' || row === 'ex2'
}

/**
 * Count skills by type in current skill list
 */
export function countSkillsByType(skills: JobSkillList): {
	main: number
	sub: number
	emp: number
	base: number
} {
	const counts = { main: 0, sub: 0, emp: 0, base: 0 }

	for (let i = 0; i < 4; i++) {
		const skill = skills[i as keyof JobSkillList]
		if (skill) {
			if (skill.main) counts.main++
			else if (skill.sub) counts.sub++
			else if (skill.emp) counts.emp++
			else if (skill.base) counts.base++
		}
	}

	return counts
}

/**
 * Validate if a skill configuration is valid for a job
 */
export function validateSkillConfiguration(
	job: Job,
	skills: JobSkillList
): { valid: boolean; errors: string[] } {
	const errors: string[] = []
	const counts = countSkillsByType(skills)

	// Check for advanced job constraints
	if (isAdvancedJob(job)) {
		if (counts.sub > 2) {
			errors.push('Maximum 2 subskills allowed for advanced jobs')
		}
		if (counts.emp > 2) {
			errors.push('Maximum 2 EMP skills allowed for advanced jobs')
		}
	}

	// Check for Row 1 constraint
	if (job.row === 1 && skills[3]) {
		errors.push('Row I jobs only support 3 skill slots')
	}

	// Check for duplicate skills
	const skillIds = new Set<string>()
	for (let i = 0; i < 4; i++) {
		const skill = skills[i as keyof JobSkillList]
		if (skill) {
			if (skillIds.has(skill.id)) {
				errors.push(`Duplicate skill: ${localizedName(skill.name)}`)
			}
			skillIds.add(skill.id)
		}
	}

	return {
		valid: errors.length === 0,
		errors
	}
}

/**
 * Proficiency options for job forms
 */
export const PROFICIENCIES = [
	{ value: 0, label: m.proficiency_none() },
	{ value: 1, label: m.proficiency_sabre() },
	{ value: 2, label: m.proficiency_dagger() },
	{ value: 3, label: m.proficiency_axe() },
	{ value: 4, label: m.proficiency_spear() },
	{ value: 5, label: m.proficiency_bow() },
	{ value: 6, label: m.proficiency_staff() },
	{ value: 7, label: m.proficiency_melee() },
	{ value: 8, label: m.proficiency_harp() },
	{ value: 9, label: m.proficiency_gun() },
	{ value: 10, label: m.proficiency_katana() }
]

/**
 * Row options for job forms
 */
export const ROWS = [
	{ value: '1', label: m.job_tier_class_1() },
	{ value: '2', label: m.job_tier_class_2() },
	{ value: '3', label: m.job_tier_class_3() },
	{ value: '4', label: m.job_tier_class_4() },
	{ value: '5', label: m.job_tier_class_5() },
	{ value: 'ex', label: m.job_tier_ex() },
	{ value: 'ex2', label: m.job_tier_ex2() },
	{ value: 'o1', label: m.job_tier_origin_1() }
]
