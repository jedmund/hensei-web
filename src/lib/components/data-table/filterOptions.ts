/**
 * Option lists for common catalogue filters, with the same labels, icons and
 * order as ElementPicker, RarityPicker and ProficiencyPicker. Values are
 * strings to match the URL and facet keys.
 */
import {
	ELEMENT_DISPLAY_ORDER,
	getElementColor,
	getElementImage,
	getElementLabel
} from '$lib/utils/element'
import {
	PROFICIENCY_DISPLAY_ORDER,
	getProficiencyImage,
	getProficiencyLabel
} from '$lib/utils/proficiency'
import { RARITY_LABELS, getRarityImage } from '$lib/utils/rarity'
import { localizedName } from '$lib/utils/locale'
import { jobOptionLabel, sortJobs } from '$lib/utils/jobUtils'
import type { Job } from '$lib/types/api/entities'
import type { FilterOption } from './filters'

/** Facet and filter value for records without a value (API: NULL) */
export const NONE_VALUE = 'none'

/** Elements in display order; `includeNull` adds Null (0), e.g. element-changeable weapons */
export function elementFilterOptions(options: { includeNull?: boolean } = {}): FilterOption[] {
	const order: number[] = [...ELEMENT_DISPLAY_ORDER]
	if (options.includeNull) order.push(0)
	return order.map((element) => ({
		value: String(element),
		label: () => getElementLabel(element),
		image: getElementImage(element),
		indicatorColor: getElementColor(element)
	}))
}

export function rarityFilterOptions(): FilterOption[] {
	return [1, 2, 3].map((rarity) => ({
		value: String(rarity),
		label: RARITY_LABELS[rarity] ?? String(rarity),
		image: getRarityImage(rarity)
	}))
}

export function weaponProficiencyFilterOptions(): FilterOption[] {
	return PROFICIENCY_DISPLAY_ORDER.map((proficiency) => ({
		value: String(proficiency),
		label: () => getProficiencyLabel(proficiency),
		image: getProficiencyImage(proficiency)
	}))
}

interface SeriesLike {
	id: string
	slug: string
	order: number
	name: { en: string; ja: string }
}

/**
 * Series in their display order. Values are slugs (readable URLs; the API
 * accepts slugs), counts come from the UUID-keyed facet. `noneLabel` adds
 * an option for records without a series.
 */
export function seriesFilterOptions(
	series: SeriesLike[] | undefined,
	noneLabel?: () => string
): FilterOption[] {
	const options: FilterOption[] = [...(series ?? [])]
		.sort((a, b) => a.order - b.order)
		.map((s) => ({ value: s.slug || s.id, label: () => localizedName(s.name), facetKey: s.id }))
	if (noneLabel) options.push({ value: NONE_VALUE, label: noneLabel })
	return options
}

/** Jobs in tier order, by id (the API filters and counts by job id) */
export function jobFilterOptions(jobs: Job[] | undefined): FilterOption[] {
	return sortJobs(jobs ?? []).map((job) => ({ value: job.id, label: () => jobOptionLabel(job) }))
}
