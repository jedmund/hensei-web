/**
 * Job skills transformation utilities
 * Handles converting between object and array formats for job skills
 */

import type { JobSkill } from '$lib/types/api/entities'

export interface JobSkillsMap {
	[slot: string]: JobSkill | null | undefined
}

export interface JobSkillPayload {
	id: string
	slot: number
}

/**
 * Converts job skills object to API array format
 * Filters out null/undefined values and adds slot numbers
 *
 * @param skillsMap - Object mapping slot numbers to job skills
 * @returns Array of job skill payloads ready for API submission
 *
 * @example
 * ```typescript
 * const skillsMap = { '0': skill1, '1': skill2, '2': null }
 * const payload = transformSkillsToArray(skillsMap)
 * // Returns: [{ id: 'skill1-id', slot: 0 }, { id: 'skill2-id', slot: 1 }]
 * ```
 */
export function transformSkillsToArray(skillsMap: JobSkillsMap): JobSkillPayload[] {
	return Object.entries(skillsMap)
		.filter(([_, skill]) => skill !== null && skill !== undefined)
		.map(([slotKey, skill]) => ({
			id: skill!.id,
			slot: parseInt(slotKey)
		}))
}

/**
 * Updates a skill in a specific slot (returns new object, immutable)
 *
 * @param currentSkills - Current job skills map
 * @param slot - Slot number to update
 * @param skill - Job skill to set, or null to remove
 * @returns New skills map with the update applied
 *
 * @example
 * ```typescript
 * const updated = updateSkillInSlot(currentSkills, 0, newSkill)
 * const removed = updateSkillInSlot(currentSkills, 1, null)
 * ```
 */
export function updateSkillInSlot(
	currentSkills: JobSkillsMap,
	slot: number,
	skill: JobSkill | null
): JobSkillsMap {
	const updated = { ...currentSkills }
	if (skill === null) {
		delete updated[String(slot)]
	} else {
		updated[String(slot)] = skill
	}
	return updated
}
