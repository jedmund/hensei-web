import { partyStore } from '$lib/stores/partyStore.svelte'
import type { CharacterSkill, CharacterSkillVersion } from '$lib/types/api/entities'
import type { GridCharacter } from '$lib/types/api/party'
import { skillToSuggestion } from './normalize'
import type { MentionSuggestion } from './types'

// Slots are surfaced in the order players refer to them: active skills, then the
// charge attack (CA / ougi), then support skills.
const SLOT_KIND_ORDER: Record<string, number> = { ability: 0, ougi: 1, support: 2 }

/** The canonical version of a slot: the base variant, else the lowest ordinal. */
function canonicalVersion(skill: CharacterSkill): CharacterSkillVersion | undefined {
	return (
		skill.versions.find((version) => version.variantRole === 'base') ??
		[...skill.versions].sort((a, b) => a.ordinal - b.ordinal)[0]
	)
}

/** Sorts a character's slots by kind (ability → ougi → support), then slot position. */
function orderedSlots(skills: CharacterSkill[]): CharacterSkill[] {
	return [...skills].sort((a, b) => {
		const kindA = SLOT_KIND_ORDER[a.kind] ?? 99
		const kindB = SLOT_KIND_ORDER[b.kind] ?? 99
		if (kindA !== kindB) return kindA - kindB
		return a.position - b.position
	})
}

/**
 * Flattens a party's characters into skill suggestions — one canonical version per
 * slot, attributed to its character, ordered active → CA → support within each
 * character. Duplicates within a character collapse (by key), but a same-named skill
 * on a different character stays a separate row.
 */
export function buildPartySkillMentions(characters: GridCharacter[]): MentionSuggestion[] {
	const suggestions: MentionSuggestion[] = []
	const seen = new Set<string>()

	for (const gridCharacter of characters) {
		const character = gridCharacter.character
		if (!character?.skills?.length) continue

		const attribution = { granblue_id: character.granblueId, name: character.name }
		for (const slot of orderedSlots(character.skills)) {
			const version = canonicalVersion(slot)
			if (!version) continue

			const suggestion = skillToSuggestion(version, slot, attribution)
			if (seen.has(suggestion.key)) continue
			seen.add(suggestion.key)
			suggestions.push(suggestion)
		}
	}

	return suggestions
}

/**
 * Filters skill suggestions by query, matching the skill name or its character's name
 * (EN/JA). Returns every match — once a character's name is typed, narrowing it further
 * won't reveal different skills, so all of that character's skills should stay visible.
 */
export function matchSkills(suggestions: MentionSuggestion[], query: string): MentionSuggestion[] {
	const needle = query.trim().toLowerCase()
	if (!needle) return []

	return suggestions.filter((suggestion) => {
		const { name, skill } = suggestion.token
		const character = skill?.character?.name
		return (
			name.en.toLowerCase().includes(needle) ||
			name.ja.toLowerCase().includes(needle) ||
			(character?.en.toLowerCase().includes(needle) ?? false) ||
			(character?.ja.toLowerCase().includes(needle) ?? false)
		)
	})
}

/** Default sync provider: party-scoped skill mentions, read straight from the global party store. */
export function partySkillMentionsProvider(query: string): MentionSuggestion[] {
	return matchSkills(buildPartySkillMentions(partyStore.party?.characters ?? []), query)
}
