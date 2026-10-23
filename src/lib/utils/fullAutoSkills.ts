import type { Character, CharacterSkill, CharacterSkillVersion } from '$lib/types/api/entities'
import { localizedName } from '$lib/utils/locale'
import { getCharacterSkillIcon } from '$lib/utils/images'

/** An ability slot surfaced in the Full Auto section. */
export interface AbilitySlot {
	/** 0-based slot number, used as the fullAutoSkills key (matches the API's
	 * "0".."3" convention, shared with the MC abilities). */
	slot: number
	/** Localized base ability name. */
	name: string
	/** Ability icon URL, or null when the base version has no game icon. */
	iconUrl: string | null
	/** Whether the skill can be toggled (gets a Switch) in Full Auto. */
	eligible: boolean
}

// A skill is NOT usable in Full Auto (so it gets no toggle) when its base
// version is a heal or field skill, or when it makes the player pick a target
// ally (target === 'one_ally', e.g. Rei's "Alaya-Vijnana").
const INELIGIBLE_TYPE_COLORS = new Set(['heal', 'field'])

function baseVersion(skill: CharacterSkill): CharacterSkillVersion | undefined {
	return (
		skill.versions.find((version) => version.variantRole === 'base') ??
		[...skill.versions].sort((a, b) => a.ordinal - b.ordinal)[0]
	)
}

function isEligible(base: CharacterSkillVersion): boolean {
	if (base.typeColor && INELIGIBLE_TYPE_COLORS.has(base.typeColor)) return false
	if (base.skillEffects?.some((effect) => effect.target === 'one_ally')) return false
	return true
}

/**
 * Returns every ability slot for a character (ougi/support excluded), in slot
 * order, with its base-version name and Full Auto eligibility. Empty array when
 * the character has no ability slots.
 */
export function getAbilitySlots(character: Character | undefined): AbilitySlot[] {
	const skills = character?.skills ?? []
	return skills
		.filter((skill) => skill.kind === 'ability')
		.sort((a, b) => a.position - b.position)
		.flatMap((skill) => {
			const base = baseVersion(skill)
			if (!base) return []
			return [
				{
					// API ability positions are 1-based (1..4); shift to the 0-based
					// "0".."3" key convention shared with the MC abilities.
					slot: skill.position - 1,
					name: localizedName(base.name),
					iconUrl: getCharacterSkillIcon(base.gameIcon),
					eligible: isEligible(base)
				}
			]
		})
}
