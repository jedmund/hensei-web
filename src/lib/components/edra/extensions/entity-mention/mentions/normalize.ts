import type { UnifiedSearchResult } from '$lib/api/adapters/search.adapter'
import type { CharacterSkill, CharacterSkillVersion, LocalizedName } from '$lib/types/api/entities'
import { elementSlug, mentionImageUrl, typeColorSwatch } from './helpers'
import type { MentionSuggestion, MentionToken } from './types'

/** Maps a unified search result into a dropdown suggestion (lifted from the old selectItem). */
export function entityResultToSuggestion(result: UnifiedSearchResult): MentionSuggestion {
	const type = result.searchableType.toLowerCase() as MentionToken['type']
	const token: MentionToken = {
		type,
		granblue_id: result.granblueId,
		name: { en: result.nameEn ?? '', ja: result.nameJp ?? '' },
		element: { id: result.element ?? 0, slug: elementSlug(result.element) },
		proficiency: result.proficiency,
		season: result.season,
		series: result.series,
		styleSwap: result.styleSwap
	}
	return {
		key: `${type}:${result.searchableId}`,
		token,
		imageUrl: mentionImageUrl(token),
		primaryLabel: result.nameEn ?? result.nameJp ?? '',
		elementSlug: token.element!.slug
	}
}

/** Maps a character skill version (one slot) into a dropdown suggestion, attributed to its character. */
export function skillToSuggestion(
	version: CharacterSkillVersion,
	slot: Pick<CharacterSkill, 'kind' | 'position'>,
	character: { granblue_id: string; name: LocalizedName }
): MentionSuggestion {
	const token: MentionToken = {
		type: 'skill',
		granblue_id: version.id,
		name: { en: version.name?.en ?? '', ja: version.name?.ja ?? '' },
		skill: {
			description: { en: version.description?.en ?? '', ja: version.description?.ja ?? '' },
			gameIcon: version.gameIcon,
			typeColor: version.typeColor,
			slotKind: slot.kind,
			slotPosition: slot.position,
			character
		}
	}
	const imageUrl = mentionImageUrl(token)
	return {
		// Keyed per character + skill name so the same-named skill on a different
		// character stays a distinct row, but a slot's duplicates collapse.
		key: `skill:${character.granblue_id}:${token.name.en || token.name.ja}`,
		token,
		imageUrl,
		swatchColor: imageUrl ? null : typeColorSwatch(version.typeColor),
		primaryLabel: token.name.en || token.name.ja,
		elementSlug: 'null'
	}
}
