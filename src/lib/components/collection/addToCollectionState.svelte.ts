/**
 * State for AddToCollectionModal: the search query and filters, the
 * collected-ids and search queries, infinite-scroll paging, the selection
 * (a set for characters, quantities for weapons and summons), and the add
 * mutation for the current entity type.
 *
 * Create it during component init: it registers queries, mutations and
 * effects, and tears the loader down with them. Bind `sentinelEl` to the
 * load-more sentinel. Everything resets when the modal closes.
 */

import {
	createInfiniteQuery,
	createQuery,
	type CreateInfiniteQueryResult,
	type CreateQueryResult,
	type InfiniteData
} from '@tanstack/svelte-query'
import { SvelteMap, SvelteSet } from 'svelte/reactivity'
import { toast } from 'svelte-sonner'
import { collectionQueries } from '$lib/api/queries/collection.queries'
import { searchQueries, type SearchPageResult } from '$lib/api/queries/search.queries'
import {
	useAddCharactersToCollection,
	useAddWeaponsToCollection,
	useAddSummonsToCollection
} from '$lib/api/mutations/collection.mutations'
import { useInfiniteLoader } from '$lib/stores/loaderState.svelte'
import type { CollectionFilterState } from '$lib/types/filter'
import { extractErrorMessage } from '$lib/utils/errors'
import * as m from '$lib/paraglide/messages'
import {
	buildAddToCollectionFilters,
	buildCharacterInputs,
	buildSummonInputs,
	buildWeaponInputs,
	entityNames,
	hasActiveSearch,
	isCancelledError,
	selectionCounts,
	uniqueResults,
	type AddToCollectionEntityType,
	type AddToCollectionResult
} from './add-to-collection.utils'

export interface AddToCollectionOptions {
	userId: () => string
	entityType: () => AddToCollectionEntityType
	open: () => boolean
}

export class AddToCollectionState {
	#opts: AddToCollectionOptions

	// --- Search ---
	searchQuery = $state('')

	// --- Filters ---
	elementFilters = $state<number[]>([])
	rarityFilters = $state<number[]>([])
	seasonFilters = $state<number[]>([])
	seriesFilters = $state<(number | string)[]>([])
	raceFilters = $state<number[]>([])
	proficiencyFilters = $state<number[]>([])
	genderFilters = $state<number[]>([])

	// --- Selection: a set for characters, quantities for weapons and summons ---
	readonly selectedIds = new SvelteSet<string>()
	readonly selectedQuantities = new SvelteMap<string, number>()
	showOnlySelected = $state(false)

	// --- Paging ---
	sentinelEl = $state<HTMLElement>()

	// Created in the constructor, once the options are set
	#collectedIdsQuery: CreateQueryResult<string[]>
	#searchResults: CreateInfiniteQueryResult<InfiniteData<SearchPageResult>>
	#addCharacters = useAddCharactersToCollection()
	#addWeapons = useAddWeaponsToCollection()
	#addSummons = useAddSummonsToCollection()
	#loader: ReturnType<typeof useInfiniteLoader>

	constructor(opts: AddToCollectionOptions) {
		this.#opts = opts

		// IDs of characters already in the collection, excluded from the search
		this.#collectedIdsQuery = createQuery(() =>
			collectionQueries.collectedCharacterIds(opts.userId(), opts.entityType() === 'character')
		)

		// Query keys differ per type but the data shape is the same
		const getSearchOptions = () => {
			const query = this.searchQuery
			const filters = this.filters
			const entityType = opts.entityType()

			if (entityType === 'character') {
				const excludeIds = this.#collectedIdsQuery.data ?? []
				const isEnabled = opts.open() && !this.#collectedIdsQuery.isLoading
				return searchQueries.characters(query, filters, 'en', excludeIds, isEnabled)
			} else if (entityType === 'weapon') {
				return { ...searchQueries.weapons(query, filters, 'en'), enabled: opts.open() }
			} else {
				return { ...searchQueries.summons(query, filters, 'en'), enabled: opts.open() }
			}
		}
		this.#searchResults = createInfiniteQuery(
			getSearchOptions as () => ReturnType<typeof searchQueries.weapons>
		)

		// State-gated infinite scroll
		this.#loader = useInfiniteLoader(
			() => this.#searchResults,
			() => this.sentinelEl,
			{ rootMargin: '200px' }
		)

		// Start paging over when the filters or show-selected change
		$effect(() => {
			void this.filters
			void this.showOnlySelected
			this.#loader.reset()
		})

		// Stop the loader when the owning component (or effect root) is destroyed
		$effect(() => () => this.#loader.destroy())

		// Reset when the modal closes
		$effect(() => {
			if (!opts.open()) {
				this.reset()
			}
		})
	}

	// --- Filters ---

	readonly filters = $derived(
		buildAddToCollectionFilters({
			element: this.elementFilters,
			rarity: this.rarityFilters,
			season: this.seasonFilters,
			series: this.seriesFilters,
			race: this.raceFilters,
			proficiency: this.proficiencyFilters,
			gender: this.genderFilters
		})
	)

	readonly hasActiveSearch = $derived(hasActiveSearch(this.searchQuery, this.filters))

	setFilters = (filters: CollectionFilterState) => {
		this.elementFilters = filters.element
		this.rarityFilters = filters.rarity
		this.seasonFilters = filters.season
		this.seriesFilters = filters.series
		this.raceFilters = filters.race
		this.proficiencyFilters = filters.proficiency
		this.genderFilters = filters.gender
	}

	// --- Results ---

	readonly allResults = $derived.by(() => uniqueResults(this.#searchResults.data?.pages ?? []))

	readonly displayedResults = $derived.by(() => {
		if (!this.showOnlySelected) return this.allResults
		if (this.#opts.entityType() === 'character') {
			return this.allResults.filter((r) => this.selectedIds.has(r.id))
		}
		return this.allResults.filter((r) => (this.selectedQuantities.get(r.id) ?? 0) > 0)
	})

	readonly isLoading = $derived.by(
		() =>
			this.#searchResults.isLoading ||
			(this.#opts.entityType() === 'character' && this.#collectedIdsQuery.isLoading)
	)

	get hasNextPage() {
		return this.#searchResults.hasNextPage
	}

	get isFetchingNextPage() {
		return this.#searchResults.isFetchingNextPage
	}

	// --- Selection ---

	readonly #counts = $derived.by(() =>
		selectionCounts(this.#opts.entityType(), this.selectedIds, this.selectedQuantities)
	)

	/** Characters selected, or total copies of weapons/summons */
	readonly selectedCount = $derived(this.#counts.count)

	/** Distinct items selected */
	readonly selectedItemCount = $derived(this.#counts.itemCount)

	toggleCharacter = (character: AddToCollectionResult) => {
		if (this.selectedIds.has(character.id)) {
			this.selectedIds.delete(character.id)
		} else {
			this.selectedIds.add(character.id)
		}
	}

	setQuantity = (item: AddToCollectionResult, quantity: number) => {
		if (quantity <= 0) {
			this.selectedQuantities.delete(item.id)
		} else {
			this.selectedQuantities.set(item.id, quantity)
		}
	}

	toggleShowSelected = () => {
		this.showOnlySelected = !this.showOnlySelected
	}

	reset() {
		this.selectedIds.clear()
		this.selectedQuantities.clear()
		this.showOnlySelected = false
		this.searchQuery = ''
		this.elementFilters = []
		this.rarityFilters = []
		this.seasonFilters = []
		this.seriesFilters = []
		this.raceFilters = []
		this.proficiencyFilters = []
		this.genderFilters = []
	}

	// --- Adding ---

	get isAdding() {
		const entityType = this.#opts.entityType()
		const mutation =
			entityType === 'character'
				? this.#addCharacters
				: entityType === 'weapon'
					? this.#addWeapons
					: this.#addSummons
		return mutation.isPending
	}

	/**
	 * Add the selection to the collection. Resolves true once it's saved, so the
	 * caller can close the modal; false if nothing was selected or it failed
	 * (failures other than cancellation are logged and toasted).
	 */
	async add(): Promise<boolean> {
		// Capture the selection before any state changes
		const entityType = this.#opts.entityType()
		const results = this.allResults

		try {
			if (entityType === 'character') {
				const inputs = buildCharacterInputs(this.selectedIds, results)
				if (inputs.length === 0) return false
				await this.#addCharacters.mutateAsync(inputs)
			} else if (entityType === 'weapon') {
				const inputs = buildWeaponInputs(this.selectedQuantities, results)
				if (inputs.length === 0) return false
				await this.#addWeapons.mutateAsync(inputs)
			} else {
				const inputs = buildSummonInputs(this.selectedQuantities, results)
				if (inputs.length === 0) return false
				await this.#addSummons.mutateAsync(inputs)
			}
			return true
		} catch (error) {
			if (!isCancelledError(error)) {
				console.error(`Failed to add ${entityNames(entityType).plural}:`, error)
				toast.error(extractErrorMessage(error, m.collection_add_error()))
			}
			return false
		}
	}
}
