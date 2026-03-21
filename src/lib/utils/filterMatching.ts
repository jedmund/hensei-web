import type { FilterItem, FilterOption } from '$lib/types/filter'
import type { RaidFull } from '$lib/types/api/raid'
import { localizedName } from '$lib/utils/locale'

interface OptionWithAliases {
	value: string
	label: string
	aliases?: string[]
}

interface MatchLocalParams {
	query: string
	filters: FilterItem[]
	excludedKinds: FilterItem['kind'][]
	elementOptions: { value: number; label: string }[]
	recencyOptions: { value: number; label: string }[]
	partyOptions: { value: string; label: string }[]
	boostOptions: OptionWithAliases[]
	sideOptions: { value: string; label: string }[]
	allRaids: RaidFull[]
	categoryLabels: {
		element: string
		recency: string
		party: string
		raid: string
		boost: string
		side: string
	}
}

export function matchLocal(params: MatchLocalParams): FilterOption[] {
	const {
		query,
		filters,
		excludedKinds,
		elementOptions,
		recencyOptions,
		partyOptions,
		boostOptions,
		sideOptions,
		allRaids,
		categoryLabels
	} = params
	const q = query.toLowerCase()
	const results: FilterOption[] = []

	// Elements
	if (!excludedKinds.includes('element')) {
		for (const el of elementOptions) {
			if (el.label.toLowerCase().includes(q)) {
				const alreadySelected = filters.some((f) => f.kind === 'element' && f.value === el.value)
				if (!alreadySelected) {
					results.push({
						kind: 'element',
						value: el.value,
						label: el.label,
						category: categoryLabels.element
					})
				}
			}
		}
	}

	// Recency
	if (!excludedKinds.includes('recency')) {
		for (const rec of recencyOptions) {
			if (rec.label.toLowerCase().includes(q)) {
				const alreadySelected = filters.some((f) => f.kind === 'recency')
				if (!alreadySelected) {
					results.push({
						kind: 'recency',
						value: rec.value,
						label: rec.label,
						category: categoryLabels.recency
					})
				}
			}
		}
	}

	// Party settings
	if (!excludedKinds.includes('party')) {
		for (const party of partyOptions) {
			if (party.label.toLowerCase().includes(q)) {
				const alreadySelected = filters.some(
					(f) => f.kind === 'party' && f.value === party.value
				)
				if (!alreadySelected) {
					results.push({
						kind: 'party',
						value: party.value,
						label: party.label,
						category: categoryLabels.party
					})
				}
			}
		}
	}

	// Raids
	if (!excludedKinds.includes('raid')) {
		for (const raid of allRaids) {
			const nameEn = raid.name?.en?.toLowerCase() ?? ''
			const nameJa = raid.name?.ja ?? ''
			if (nameEn.includes(q) || nameJa.includes(q)) {
				const alreadySelected = filters.some((f) => f.kind === 'raid' && f.value === raid.id)
				if (!alreadySelected) {
					results.push({
						kind: 'raid',
						value: raid.id,
						label: localizedName(raid.name) ?? raid.slug,
						category: categoryLabels.raid
					})
				}
			}
		}
	}

	// Boost
	if (!filters.some((f) => f.kind === 'boost')) {
		for (const boost of boostOptions) {
			const aliases = boost.aliases ?? []
			if (boost.label.toLowerCase().includes(q) || aliases.some((a) => a.includes(q))) {
				results.push({
					kind: 'boost',
					value: boost.value,
					label: boost.label,
					category: categoryLabels.boost
				})
			}
		}
	}

	// Side
	if (!filters.some((f) => f.kind === 'side')) {
		for (const side of sideOptions) {
			if (side.label.toLowerCase().includes(q)) {
				results.push({
					kind: 'side',
					value: side.value,
					label: side.label,
					category: categoryLabels.side
				})
			}
		}
	}

	return results
}

export function rankResults(results: FilterOption[], query: string): FilterOption[] {
	const filterKinds = new Set(['element', 'recency', 'party', 'boost', 'side', 'class'])

	return results.toSorted((a, b) => {
		const aLabel = a.label.toLowerCase()
		const bLabel = b.label.toLowerCase()
		const aExact = aLabel === query
		const bExact = bLabel === query
		if (aExact !== bExact) return aExact ? -1 : 1

		const aPrefix = aLabel.startsWith(query)
		const bPrefix = bLabel.startsWith(query)
		if (aPrefix !== bPrefix) return aPrefix ? -1 : 1

		const aFilter = filterKinds.has(a.kind)
		const bFilter = filterKinds.has(b.kind)
		if (aFilter !== bFilter) return aFilter ? -1 : 1

		return 0
	})
}
