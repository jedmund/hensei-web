/**
 * Job Utility Functions
 *
 * Helper functions for job-related operations including
 * image URL generation, tier naming, and validation.
 */

import type { Job, JobSkill } from '$lib/types/api/entities'
import type { JobSkillList } from '$lib/types/api/party'

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
		return '/images/placeholders/placeholder-weapon-grid.png'
	}

	// Convert job name to slug format (lowercase, spaces to hyphens)
	const slug = job.name.en.toLowerCase().replace(/\s+/g, '-')
	const genderSuffix = gender === Gender.Djeeta ? 'b' : 'a'

	return `/images/job-portraits/${slug}_${genderSuffix}.png`
}

/**
 * Generate full job image URL for JobSection component
 * These are full job images stored in /static/images/jobs/
 */
export function getJobFullImageUrl(job: Job | undefined, gender: Gender = Gender.Gran): string {
	if (!job) {
		return '/images/placeholders/placeholder-weapon-grid.png'
	}

	const genderSuffix = gender === Gender.Djeeta ? 'b' : 'a'

	return `/images/job-zoom/${job.granblueId}_${genderSuffix}.png`
}

/**
 * Generate job icon URL
 * Job icons are small square icons representing the job
 * Images are stored locally in /static/images/job-icons/
 */
export function getJobIconUrl(granblueId: string | undefined): string {
	if (!granblueId) {
		return '/images/placeholders/placeholder-weapon-grid.png'
	}

	return `/images/job-icons/${granblueId}.png`
}

/**
 * Generate job wide banner image URL for JobItem component
 * These are wider banner-style images stored in /static/images/job-wide/
 */
export function getJobWideImageUrl(job: Job | undefined, gender: Gender = Gender.Gran): string {
	if (!job) {
		return '/images/placeholders/placeholder-weapon-grid.png'
	}

	const genderSuffix = gender === Gender.Djeeta ? 'b' : 'a'
	return `/images/job-wide/${job.granblueId}_${genderSuffix}.jpg`
}

/**
 * Get job tier display name
 * Converts internal row codes to user-friendly names
 */
export function getJobTierName(row: string | number): string {
	const tierNames: Record<string, string> = {
		'1': 'Class I',
		'2': 'Class II',
		'3': 'Class III',
		'4': 'Class IV',
		'5': 'Class V',
		ex: 'Extra',
		ex2: 'Extra II'
	}

	const rowStr = row.toString().toLowerCase()
	return tierNames[rowStr] || `Class ${row}`
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
		ex2: 7
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
	return job.row === 1 || job.row === '1' ? 3 : 4
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
	if (skill.main) return 'Main'
	if (skill.sub) return 'Subskill'
	// Use category field for additional classification
	if (skill.category === 2) return 'EMP'
	if (skill.category === 1) return 'Base'
	return 'Unknown'
}

/**
 * Get skill category color
 * Returns CSS color variable name
 */
export function getSkillCategoryColor(skill: JobSkill): string {
	if (skill.main) return 'var(--skill-main)'
	if (skill.sub) return 'var(--skill-sub)'
	// Use category field for additional classification
	if (skill.category === 2) return 'var(--skill-emp)'
	if (skill.category === 1) return 'var(--skill-base)'
	return 'var(--skill-default)'
}

/**
 * Format job proficiency for display
 * Converts proficiency numbers to weapon type names
 */
export function formatJobProficiency(proficiency: [number, number]): string[] {
	const weaponTypes: Record<number, string> = {
		1: 'Sword',
		2: 'Dagger',
		3: 'Spear',
		4: 'Axe',
		5: 'Staff',
		6: 'Gun',
		7: 'Melee',
		8: 'Bow',
		9: 'Harp',
		10: 'Katana'
	}

	const result: string[] = []
	if (proficiency[0] && weaponTypes[proficiency[0]]) {
		result.push(weaponTypes[proficiency[0]])
	}
	if (proficiency[1] && weaponTypes[proficiency[1]]) {
		result.push(weaponTypes[proficiency[1]])
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
			// Use category field for additional classification
			else if (skill.category === 2) counts.emp++
			else if (skill.category === 1) counts.base++
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
	if ((job.row === 1 || job.row === '1') && skills[3]) {
		errors.push('Row I jobs only support 3 skill slots')
	}

	// Check for duplicate skills
	const skillIds = new Set<string>()
	for (let i = 0; i < 4; i++) {
		const skill = skills[i as keyof JobSkillList]
		if (skill) {
			if (skillIds.has(skill.id)) {
				errors.push(`Duplicate skill: ${skill.name.en}`)
			}
			skillIds.add(skill.id)
		}
	}

	return {
		valid: errors.length === 0,
		errors
	}
}
