import type { SearchResult } from '$lib/api/adapters/search.adapter'
import type { CharacterSeriesRef } from '$lib/types/api/characterSeries'
import { localizedName } from '$lib/utils/locale'

/**
 * One search result in CharacterTypeahead. `id` is the character row id: a
 * base character and its style row share a `granblueId`, so only `id` tells
 * them apart.
 */
export interface CharacterTypeaheadOption {
	id: string
	label: string
	granblueId: string
	element?: number | null
	season?: number | null
	series?: (number | CharacterSeriesRef)[] | null
	styleSwap?: boolean
}

export function toCharacterTypeaheadOption(result: SearchResult): CharacterTypeaheadOption {
	return {
		id: result.id,
		label: localizedName(result.name) !== '—' ? localizedName(result.name) : result.granblueId,
		granblueId: result.granblueId,
		element: result.element,
		season: result.season,
		series: Array.isArray(result.series) ? result.series : null,
		styleSwap: result.styleSwap
	}
}

/** The combobox row id that shows `value` (a granblueId), if any option shows it. */
export function rowIdForValue(
	value: string | null | undefined,
	...candidates: (CharacterTypeaheadOption | null | undefined)[]
): string {
	if (!value) return ''
	return candidates.find((c) => c?.granblueId === value)?.id ?? ''
}
