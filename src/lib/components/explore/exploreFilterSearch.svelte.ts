/**
 * State for the Gallery filter picker (ExploreFilters): the typed query, the
 * debounced entity search, the dropdown and its keyboard selection, and the
 * pill edits. The component owns the bindable `filters`; this reads them
 * through `getFilters` and writes through `commit`.
 *
 * Create it during component init: it registers queries and effects.
 */

import { createQuery } from '@tanstack/svelte-query'
import { searchAdapter } from '$lib/api/adapters/search.adapter'
import type { UnifiedSearchResult } from '$lib/api/adapters/search.adapter'
import { difficultyQueries } from '$lib/api/queries/difficulty.queries'
import { stickerQueries } from '$lib/api/queries/sticker.queries'
import { getLocale } from '$lib/paraglide/runtime'
import type { RaidFull } from '$lib/types/api/raid'
import type { FilterItem, FilterOption, PlaceholderSuggestion } from '$lib/types/filter'
import { getElementOptions } from '$lib/utils/element'
import {
	getBoostOptions,
	getPartyOptions,
	getRecencyOptions,
	getSideOptions
} from '$lib/utils/exploreFilterOptions'
import {
	addFilterOption,
	buildPlaceholderSuggestions,
	entitySuggestionToOption,
	getExploreCategoryLabels,
	lastUnpinnedIndex,
	pickRandom,
	relabelFilters,
	removeFilterAt,
	searchResultToOption,
	toggleEntityModeAt
} from '$lib/utils/exploreFilterSelection'
import { matchLocal, rankResults } from '$lib/utils/filterMatching'
import { localizedName } from '$lib/utils/locale'
import { pickerStickers } from '$lib/utils/stickers'

const SEARCH_DEBOUNCE_MS = 300
const MIN_QUERY_LENGTH = 2

interface ExploreFilterSearchOptions {
	getFilters: () => FilterItem[]
	/** Replace the filters and notify the parent */
	commit: (filters: FilterItem[]) => void
	getExcludedKinds: () => FilterItem['kind'][]
	getAllRaids: () => RaidFull[]
	/** Evoking Solomonis route Evokers to offer as filters (granblue_id + name) */
	getEvokerOptions: () => { value: string; label: string }[]
}

export class ExploreFilterSearch {
	inputValue = $state('')
	dropdownOpen = $state(false)
	selectedIndex = $state(0)
	isSearching = $state(false)
	placeholderSuggestions = $state<PlaceholderSuggestion[]>([])
	inputEl = $state<HTMLInputElement>()

	#searchResults = $state<UnifiedSearchResult[]>([])
	#isComposing = $state(false)
	#searchTimeout: ReturnType<typeof setTimeout> | null = null
	#opts: ExploreFilterSearchOptions

	#stickersQuery = createQuery(() => stickerQueries.active())
	#difficultyTiersQuery = createQuery(() => difficultyQueries.tiers())

	readonly categoryLabels = $derived(getExploreCategoryLabels())

	// Sticker labels: the active catalogue, by slug + meaning
	readonly #labelOptions = $derived(
		pickerStickers(this.#stickersQuery.data).map((sticker) => ({
			value: sticker.slug,
			label: localizedName(sticker.meaning)
		}))
	)

	readonly #difficultyOptions = $derived(
		(this.#difficultyTiersQuery.data ?? []).map((tier) => ({
			value: tier.slug,
			label: tier.name
		}))
	)

	readonly #elementOptions = $derived(getElementOptions())

	// Evoking Solomonis route Evokers not already filtered by
	readonly #evokerSuggestions = $derived.by((): FilterOption[] => {
		const filters = this.#opts.getFilters()
		return this.#opts
			.getEvokerOptions()
			.filter((e) => !filters.some((f) => f.kind === 'evoker' && f.value === e.value))
			.map((e) => ({
				kind: 'evoker',
				value: e.value,
				label: e.label,
				category: this.categoryLabels.evoker
			}))
	})

	readonly #elementSuggestions = $derived<FilterOption[]>(
		this.#elementOptions
			.filter((e) => e.value !== 0)
			.map((e) => ({
				kind: 'element',
				value: e.value,
				label: e.label,
				category: this.categoryLabels.element
			}))
	)

	/** Local matches + API entity results for the typed query */
	readonly displayResults = $derived.by((): FilterOption[] => {
		if (!this.dropdownOpen || !this.inputValue.trim()) return []
		const filters = this.#opts.getFilters()

		const local = matchLocal({
			query: this.inputValue,
			filters,
			excludedKinds: this.#opts.getExcludedKinds(),
			elementOptions: this.#elementOptions,
			recencyOptions: getRecencyOptions(),
			partyOptions: getPartyOptions(),
			boostOptions: getBoostOptions(),
			sideOptions: getSideOptions(),
			difficultyOptions: this.#difficultyOptions,
			labelOptions: this.#labelOptions,
			allRaids: this.#opts.getAllRaids(),
			categoryLabels: this.categoryLabels
		})

		const apiResults = this.#searchResults
			.filter((r) => !filters.some((f) => f.kind === 'entity' && f.granblueId === r.granblueId))
			.map(searchResultToOption)

		const query = this.inputValue.trim().toLowerCase()
		const evokers = this.#evokerSuggestions.filter((e) => e.label.toLowerCase().includes(query))

		return rankResults([...evokers, ...local, ...apiResults], query)
	})

	constructor(opts: ExploreFilterSearchOptions) {
		this.#opts = opts

		// A label restored from the URL (?label=fast) lands with label === value;
		// swap in the sticker's meaning once the catalogue loads.
		$effect(() => {
			const stickers = this.#stickersQuery.data
			if (!stickers || stickers.length === 0) return
			const next = relabelFilters(this.#opts.getFilters(), 'label', (value) => {
				const sticker = stickers.find((s) => s.slug === value)
				return sticker ? localizedName(sticker.meaning) : undefined
			})
			if (next) this.#opts.commit(next)
		})

		// Same for ?difficulty=casual,mid once the tier list settles
		$effect(() => {
			const tiers = this.#difficultyTiersQuery.data
			if (!tiers || tiers.length === 0) return
			const next = relabelFilters(
				this.#opts.getFilters(),
				'difficulty',
				(value) => tiers.find((t) => t.slug === value)?.name
			)
			if (next) this.#opts.commit(next)
		})

		// Reset selected index when results change
		$effect(() => {
			void this.displayResults
			this.selectedIndex = 0
		})

		// Trigger search on input change (skip during IME composition)
		$effect(() => {
			if (!this.#isComposing) this.#searchEntities(this.inputValue)
		})
	}

	async refreshSuggestions() {
		const excludedKinds = this.#opts.getExcludedKinds()
		let entity: FilterOption | undefined
		if (!excludedKinds.includes('entity')) {
			try {
				const { suggestions } = await searchAdapter.getRandomSuggestions()
				const picked = pickRandom(suggestions)
				if (picked) entity = entitySuggestionToOption(picked)
			} catch {
				// Non-critical — other suggestions still show
			}
		}

		this.placeholderSuggestions = buildPlaceholderSuggestions({
			filters: this.#opts.getFilters(),
			excludedKinds,
			categoryLabels: this.categoryLabels,
			evokerSuggestions: this.#evokerSuggestions,
			elementSuggestions: this.#elementSuggestions,
			allRaids: this.#opts.getAllRaids(),
			labelOptions: this.#labelOptions,
			entity
		})
	}

	// Debounced API search
	#searchEntities(query: string) {
		if (this.#searchTimeout) clearTimeout(this.#searchTimeout)

		if (query.length < MIN_QUERY_LENGTH) {
			this.#searchResults = []
			this.isSearching = false
			return
		}

		this.isSearching = true
		this.#searchTimeout = setTimeout(async () => {
			try {
				const response = await searchAdapter.searchAll({
					query,
					per: 10,
					locale: getLocale() as 'en' | 'ja'
				})
				this.#searchResults = response.results ?? []
			} catch {
				this.#searchResults = []
			} finally {
				this.isSearching = false
			}
		}, SEARCH_DEBOUNCE_MS)
	}

	open = () => {
		this.refreshSuggestions()
		this.dropdownOpen = true
		requestAnimationFrame(() => this.inputEl?.focus())
	}

	close = () => {
		this.dropdownOpen = false
		this.inputValue = ''
		this.#searchResults = []
	}

	selectOption = (option: FilterOption) => {
		const next = addFilterOption(this.#opts.getFilters(), option)
		if (!next) return
		this.#opts.commit(next)
		this.inputValue = ''
		this.#searchResults = []
	}

	selectSuggestion = (suggestion: PlaceholderSuggestion | undefined) => {
		if (suggestion?.option) this.selectOption(suggestion.option)
	}

	removeFilter = (index: number) => {
		const next = removeFilterAt(this.#opts.getFilters(), index)
		if (next) this.#opts.commit(next)
	}

	toggleEntityMode = (index: number) => {
		const next = toggleEntityModeAt(this.#opts.getFilters(), index)
		if (next) this.#opts.commit(next)
	}

	handleCompositionStart = () => {
		this.#isComposing = true
		if (this.#searchTimeout) clearTimeout(this.#searchTimeout)
	}

	handleCompositionEnd = (e: CompositionEvent) => {
		setTimeout(() => {
			this.#isComposing = false
			const value = (e.target as HTMLInputElement)?.value ?? ''
			this.#searchEntities(value)
		}, 50)
	}

	handleKeydown = (e: KeyboardEvent) => {
		if (e.isComposing || e.keyCode === 229) return

		const isPlaceholder = !this.inputValue.trim()
		const listLength = isPlaceholder
			? this.placeholderSuggestions.length
			: this.displayResults.length

		if (e.key === 'ArrowDown') {
			e.preventDefault()
			this.selectedIndex = Math.min(this.selectedIndex + 1, listLength - 1)
		} else if (e.key === 'ArrowUp') {
			e.preventDefault()
			this.selectedIndex = Math.max(this.selectedIndex - 1, 0)
		} else if (e.key === 'Enter') {
			e.preventDefault()
			if (isPlaceholder) {
				this.selectSuggestion(this.placeholderSuggestions[this.selectedIndex])
			} else {
				const option = this.displayResults[this.selectedIndex]
				if (option) this.selectOption(option)
			}
		} else if (e.key === 'Escape') {
			this.close()
		} else if (e.key === 'Backspace' && this.inputValue === '') {
			const index = lastUnpinnedIndex(this.#opts.getFilters())
			if (index >= 0) this.removeFilter(index)
		}
	}
}
