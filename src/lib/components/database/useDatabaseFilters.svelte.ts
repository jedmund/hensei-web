import type { CollectionFilterState } from '$lib/types/filter'
import { parseFiltersFromUrl, buildUrlFromFilters } from '$lib/utils/filterParams'
import type { DatabaseProvider } from '$lib/providers/DatabaseProvider'

/** The jobs grid's URL state: the search, the page and any filters the URL carries */
export class DatabaseFilters {
	elementFilters = $state<number[]>([])
	rarityFilters = $state<number[]>([])
	seriesFilters = $state<(number | string)[]>([])
	proficiencyFilters = $state<number[]>([])
	seasonFilters = $state<number[]>([])

	#provider: DatabaseProvider

	constructor(provider: DatabaseProvider) {
		this.#provider = provider
	}

	buildUrlParams(searchTerm: string, pageNum: number, pathname: string): string {
		const filterState: CollectionFilterState = {
			element: this.elementFilters,
			rarity: this.rarityFilters,
			proficiency: this.proficiencyFilters,
			season: this.seasonFilters,
			series: this.seriesFilters,
			race: [],
			gender: []
		}
		const params = buildUrlFromFilters(filterState, searchTerm, pageNum, 'job')
		const search = params.toString()
		return search ? `${pathname}?${search}` : pathname
	}

	/** Initialize filters from URL params. Returns the starting page number. */
	initializeFromUrl(
		searchParams: URLSearchParams,
		setSearchTerm: (term: string) => void,
		setLastSearchTerm: (term: string) => void
	): number {
		const parsed = parseFiltersFromUrl(searchParams, 'job')

		this.elementFilters = parsed.element
		this.rarityFilters = parsed.rarity
		this.proficiencyFilters = parsed.proficiency
		this.seasonFilters = parsed.season
		this.seriesFilters = parsed.series
		setSearchTerm(parsed.searchQuery)

		const hasFilters =
			parsed.element.length > 0 ||
			parsed.rarity.length > 0 ||
			parsed.proficiency.length > 0 ||
			parsed.season.length > 0 ||
			parsed.series.length > 0

		if (hasFilters) {
			const seriesAsStrings =
				parsed.series.length > 0 ? parsed.series.map((s) => String(s)) : undefined

			this.#provider.setFilters({
				element: parsed.element.length > 0 ? parsed.element : undefined,
				rarity: parsed.rarity.length > 0 ? parsed.rarity : undefined,
				series: seriesAsStrings,
				proficiency1: parsed.proficiency.length > 0 ? parsed.proficiency : undefined,
				season: parsed.season.length > 0 ? parsed.season : undefined
			})
		}

		if (parsed.searchQuery.length >= 2) {
			this.#provider.setSearchQuery(parsed.searchQuery)
			setLastSearchTerm(parsed.searchQuery)
		}

		return parsed.page
	}
}
