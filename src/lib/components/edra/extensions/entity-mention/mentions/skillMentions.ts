import { partyStore } from '$lib/stores/partyStore.svelte'
import type { CharacterSkill, CharacterSkillVersion } from '$lib/types/api/entities'
import type { GridCharacter } from '$lib/types/api/party'
import { skillToSuggestion } from './normalize'
import type { MentionSuggestion } from './types'

/** Max skill rows surfaced for a single query. */
const SKILL_RESULT_CAP = 5

/** The canonical version of a slot: the base variant, else the lowest ordinal. */
function canonicalVersion(skill: CharacterSkill): CharacterSkillVersion | undefined {
	return (
		skill.versions.find((version) => version.variantRole === 'base') ??
		[...skill.versions].sort((a, b) => a.ordinal - b.ordinal)[0]
	)
}

/**
 * Flattens a party's characters into skill suggestions — one canonical version per
 * slot, attributed to its character. Duplicates within a character collapse (by key),
 * but a same-named skill on a different character stays a separate row.
 */
export function buildPartySkillMentions(characters: GridCharacter[]): MentionSuggestion[] {
	const suggestions: MentionSuggestion[] = []
	const seen = new Set<string>()

	for (const gridCharacter of characters) {
		const character = gridCharacter.character
		if (!character?.skills?.length) continue

		const attribution = { granblue_id: character.granblueId, name: character.name }
		for (const slot of character.skills) {
			const version = canonicalVersion(slot)
			if (!version) continue

			const suggestion = skillToSuggestion(version, slot.kind, attribution)
			if (seen.has(suggestion.key)) continue
			seen.add(suggestion.key)
			suggestions.push(suggestion)
		}
	}

	return suggestions
}

/** Filters skill suggestions by query, matching the skill name or its character's name (EN/JA). */
export function matchSkills(suggestions: MentionSuggestion[], query: string): MentionSuggestion[] {
	const needle = query.trim().toLowerCase()
	if (!needle) return []

	return suggestions
		.filter((suggestion) => {
			const { name, skill } = suggestion.token
			const character = skill?.character?.name
			return (
				name.en.toLowerCase().includes(needle) ||
				name.ja.toLowerCase().includes(needle) ||
				(character?.en.toLowerCase().includes(needle) ?? false) ||
				(character?.ja.toLowerCase().includes(needle) ?? false)
			)
		})
		.slice(0, SKILL_RESULT_CAP)
}

/** Default sync provider: party-scoped skill mentions, read straight from the global party store. */
export function partySkillMentionsProvider(query: string): MentionSuggestion[] {
	return matchSkills(buildPartySkillMentions(partyStore.party?.characters ?? []), query)
}
