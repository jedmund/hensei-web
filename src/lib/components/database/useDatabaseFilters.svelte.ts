import type { CollectionFilterState } from '$lib/components/collection/CollectionFilters.svelte'
import {
	parseFiltersFromUrl,
	buildUrlFromFilters,
	ELEMENT_TO_PARAM
} from '$lib/utils/filterParams'
import type { DatabaseProvider } from '$lib/providers/DatabaseProvider'
import type { WeaponSeries } from '$lib/types/api/weaponSeries'

export type EntityType = 'weapon' | 'character' | 'summon' | 'job'
export type ResourceType = 'weapons' | 'characters' | 'summons' | 'jobs'

export class DatabaseFilters {
	elementFilters = $state<number[]>([])
	rarityFilters = $state<number[]>([])
	seriesFilters = $state<(number | string)[]>([])
	proficiencyFilters = $state<number[]>([])
	seasonFilters = $state<number[]>([])
	showFilters = $state(false)

	#resource: ResourceType
	#entityType: EntityType
	#provider: DatabaseProvider
	#getWeaponSeriesData: () => WeaponSeries[] | undefined
	#onReload: (page: number) => void

	readonly hasActiveFilters = $derived(
		this.elementFilters.length > 0 ||
			this.rarityFilters.length > 0 ||
			this.seriesFilters.length > 0 ||
			this.proficiencyFilters.length > 0 ||
			this.seasonFilters.length > 0
	)

	readonly filterCount = $derived(
		this.elementFilters.length +
			this.rarityFilters.length +
			this.seriesFilters.length +
			this.proficiencyFilters.length +
			this.seasonFilters.length
	)

	readonly selectedElement = $derived.by(() => {
		if (this.elementFilters.length === 1) {
			const elemId = this.elementFilters[0]
			if (elemId !== undefined) {
				const elemName = ELEMENT_TO_PARAM[elemId]
				if (elemName && elemName !== 'null') {
					return elemName as 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'
				}
			}
		}
		return undefined
	})

	constructor(
		resource: ResourceType,
		entityType: EntityType,
		provider: DatabaseProvider,
		getWeaponSeriesData: () => WeaponSeries[] | undefined,
		onReload: (page: number) => void
	) {
		this.#resource = resource
		this.#entityType = entityType
		this.#provider = provider
		this.#getWeaponSeriesData = getWeaponSeriesData
		this.#onReload = onReload
	}

	handleFiltersChange(filters: CollectionFilterState) {
		const seriesAsStrings =
			filters.series.length > 0 ? filters.series.map((s) => String(s)) : undefined

		this.#provider.setFilters({
			element: filters.element.length > 0 ? filters.element : undefined,
			rarity: filters.rarity.length > 0 ? filters.rarity : undefined,
			series: seriesAsStrings,
			proficiency1: filters.proficiency.length > 0 ? filters.proficiency : undefined,
			season: filters.season.length > 0 ? filters.season : undefined,
			characterSeries:
				this.#resource === 'characters' && filters.series.length > 0
					? filters.series.filter((s): s is number => typeof s === 'number')
					: undefined
		})
		this.#onReload(1)
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
		const params = buildUrlFromFilters(
			filterState,
			searchTerm,
			pageNum,
			this.#entityType,
			this.#getWeaponSeriesData()
		)
		const search = params.toString()
		return search ? `${pathname}?${search}` : pathname
	}

	/** Initialize filters from URL params. Returns the starting page number. */
	initializeFromUrl(
		searchParams: URLSearchParams,
		setSearchTerm: (term: string) => void,
		setLastSearchTerm: (term: string) => void
	): number {
		const parsed = parseFiltersFromUrl(
			searchParams,
			this.#entityType,
			this.#getWeaponSeriesData()
		)

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
				season: parsed.season.length > 0 ? parsed.season : undefined,
				characterSeries:
					this.#resource === 'characters' && parsed.series.length > 0
						? parsed.series.filter((s): s is number => typeof s === 'number')
						: undefined
			})
			this.showFilters = true
		}

		if (parsed.searchQuery.length >= 2) {
			this.#provider.setSearchQuery(parsed.searchQuery)
			setLastSearchTerm(parsed.searchQuery)
		}

		return parsed.page
	}
}
