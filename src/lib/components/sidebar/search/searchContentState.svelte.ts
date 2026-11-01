/**
 * State for the add-item search sidebar (SearchContent): the typed query and
 * its debounce, the filters, the All/Collection mode and collection owner, the
 * catalogue and collection queries, and infinite-scroll paging.
 *
 * Create it during component init: it registers queries, effects and an
 * onDestroy hook. Bind `sentinelEl` to the load-more sentinel.
 */

import { SvelteSet } from 'svelte/reactivity'
import { onDestroy } from 'svelte'
import {
	createInfiniteQuery,
	createQuery,
	type CreateInfiniteQueryResult,
	type CreateQueryResult
} from '@tanstack/svelte-query'
import { searchQueries } from '$lib/api/queries/search.queries'
import { collectionQueries } from '$lib/api/queries/collection.queries'
import { entityQueries } from '$lib/api/queries/entity.queries'
import { crewQueries, type AccessibleCollectionMember } from '$lib/api/queries/crew.queries'
import { userQueries } from '$lib/api/queries/user.queries'
import type { UserInfo } from '$lib/api/adapters/user.adapter'
import { partyStore } from '$lib/stores/partyStore.svelte'
import { useInfiniteLoader } from '$lib/stores/loaderState.svelte'
import { localizedName } from '$lib/utils/locale'
import { getLocale } from '$lib/paraglide/runtime'
import * as m from '$lib/paraglide/messages'
import type { AddItemResult, SearchMode } from '$lib/types/api/search'
import {
	buildMemberOptions,
	mapCollectionToSearchResult,
	resolveMember
} from './collection-search.utils'
import {
	buildCollectionFilters,
	buildSearchFilters,
	dedupeResultsById,
	partyCollectionIds,
	type SearchEntityType
} from './search-filters.utils'

const SEARCH_DEBOUNCE_MS = 300
/** Safari fires compositionend before the final input event */
const COMPOSITION_END_DELAY_MS = 50

export interface SearchContentOptions {
	type: () => SearchEntityType
	authUserId: () => string | undefined
	requiredProficiencies: () => number[] | undefined
	initialCollectionSourceUsername: () => string | undefined
	isFriendSlot: () => boolean
	isSubauraSlot: () => boolean
	isExtraSlot: () => boolean
}

export class SearchContentState {
	#opts: SearchContentOptions

	// --- Query text ---
	searchQuery = $state('')
	debouncedSearchQuery = $state('')
	#isComposing = $state(false)
	#debounceTimer: ReturnType<typeof setTimeout> | undefined

	// --- Filters ---
	elementFilters = $state<number[]>([])
	rarityFilters = $state<number[]>([])
	proficiencyFilters = $state<number[]>([])
	seriesFilter = $state<string | undefined>(undefined)
	subauraFilter = $derived.by(() => this.#opts.isSubauraSlot())

	// --- Paging ---
	sentinelEl = $state<HTMLElement>()

	/** Reactively derived from the party store, so it stays in sync after mutations */
	readonly collectionSourceUserId = $derived(partyStore.party?.collectionSourceUserId)

	// Created in the constructor, once the options are set
	#externalUserQuery: CreateQueryResult<UserInfo>
	#seriesQuery: CreateQueryResult<unknown>
	#myCrewQuery: CreateQueryResult<unknown>
	#crewMembersQuery: CreateQueryResult<AccessibleCollectionMember[]>
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- polymorphic per entity type
	#searchQueryResult: CreateInfiniteQueryResult<any>
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- polymorphic per entity type
	#collectionQueryResult: CreateInfiniteQueryResult<any>
	#ownedIdsQuery: CreateQueryResult<unknown>
	#loader: ReturnType<typeof useInfiniteLoader>

	/** Defaults to 'collection' when a collection source is already set on the party */
	searchMode = $derived.by<SearchMode>(() =>
		!this.#opts.isFriendSlot() &&
		(this.collectionSourceUserId || this.#opts.initialCollectionSourceUsername())
			? 'collection'
			: 'all'
	)

	/** Crew member whose collection is searched; defaults to self */
	selectedMemberId = $derived.by<string | undefined>(() => this.#opts.authUserId())

	constructor(opts: SearchContentOptions) {
		this.#opts = opts

		this.#externalUserQuery = createQuery(() => ({
			...userQueries.info(opts.initialCollectionSourceUsername() ?? ''),
			enabled: !!opts.initialCollectionSourceUsername()
		}))

		// When the external user loads, select them as the collection owner
		$effect(() => {
			if (this.#externalUserQuery.data && !this.collectionSourceUserId) {
				this.selectedMemberId = this.#externalUserQuery.data.id
			}
		})

		// Debounce query changes (skipped during IME composition)
		$effect(() => {
			const query = this.searchQuery

			if (this.#debounceTimer) {
				clearTimeout(this.#debounceTimer)
			}

			if (this.#isComposing) return

			this.#debounceTimer = setTimeout(() => {
				this.debouncedSearchQuery = query
			}, SEARCH_DEBOUNCE_MS)

			return () => {
				if (this.#debounceTimer) {
					clearTimeout(this.#debounceTimer)
				}
			}
		})

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		this.#seriesQuery = createQuery(() => entityQueries.seriesListByType(opts.type()) as any)

		// crewStore is only populated on /crew routes, so query crew membership directly
		this.#myCrewQuery = createQuery(() => ({
			...crewQueries.myCrew(),
			enabled: !!opts.authUserId()
		}))

		// Crew members with accessible collections (for the collection-mode dropdown)
		this.#crewMembersQuery = createQuery(() => ({
			...crewQueries.accessibleCollectionMembers(),
			enabled: this.isInCrew
		}))

		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- polymorphic TanStack Query options
		this.#searchQueryResult = createInfiniteQuery((): any =>
			searchQueries.byType(
				opts.type(),
				this.debouncedSearchQuery,
				this.filters,
				getLocale() as 'en' | 'ja'
			)
		)

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		this.#collectionQueryResult = createInfiniteQuery((): any => {
			const userId = this.collectionUserId
			if (!userId) {
				return {
					...collectionQueries.characters(userId ?? '', {}, false),
					enabled: false
				}
			}

			return {
				...collectionQueries.byType(
					opts.type(),
					userId,
					buildCollectionFilters(this.filters, this.searchMode, this.debouncedSearchQuery)
				),
				enabled: true
			}
		})

		// On the 'all' tab, search results never carry collectionId, so cross-
		// reference against the user's collection (by catalog id) to mark items
		// they already own. Skipped on the 'collection' tab — items there
		// already have collectionId set.
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- query option types differ per type, but the result shape is identical (string[])
		this.#ownedIdsQuery = createQuery((): any => {
			const userId = opts.authUserId()
			const type = opts.type()
			const enabled = !!userId && this.searchMode === 'all'
			if (type === 'character')
				return collectionQueries.collectedCharacterIds(userId ?? '', enabled)
			if (type === 'weapon') return collectionQueries.collectedWeaponIds(userId ?? '', enabled)
			return collectionQueries.collectedSummonIds(userId ?? '', enabled)
		})

		this.#loader = useInfiniteLoader(
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- createInfiniteQuery result type doesn't match useInfiniteLoader generic exactly
			() => this.activeQuery as any,
			() => this.sentinelEl,
			{ rootMargin: '200px' }
		)

		// Start paging over when the mode or filters change
		$effect(() => {
			void this.searchMode
			void this.filters
			this.#loader.reset()
		})

		onDestroy(() => this.#loader.destroy())
	}

	// --- IME composition ---

	handleCompositionStart = () => {
		this.#isComposing = true
	}

	handleCompositionEnd = () => {
		setTimeout(() => {
			this.#isComposing = false
		}, COMPOSITION_END_DELAY_MS)
	}

	/** Empty the query immediately, cancelling any pending debounce */
	clearQuery() {
		this.searchQuery = ''
		if (this.#debounceTimer) clearTimeout(this.#debounceTimer)
		this.debouncedSearchQuery = ''
	}

	// --- Series ---

	readonly seriesOptions = $derived.by(() => {
		const data = this.#seriesQuery.data as
			Array<{ id: string; name: { en?: string; ja?: string } }> | undefined
		if (!data) return []
		return data.map((s) => ({
			value: s.id,
			label: localizedName(s.name)
		}))
	})

	// --- Collection owner ---

	readonly isInCrew = $derived.by(() => !!this.#myCrewQuery.data)

	readonly #crewMembers = $derived.by(() => this.#crewMembersQuery.data ?? [])

	readonly memberOptions = $derived.by(() =>
		buildMemberOptions(
			this.#crewMembers,
			this.#opts.authUserId(),
			this.#externalUserQuery.data ?? undefined
		)
	)

	readonly collectionUserId = $derived.by(() => {
		if (this.collectionSourceUserId) return this.collectionSourceUserId
		if (this.searchMode !== 'collection') return this.#opts.authUserId()
		return this.selectedMemberId
	})

	readonly isCollectionLocked = $derived(!!this.collectionSourceUserId)

	readonly showMemberSection = $derived.by(
		() =>
			this.searchMode === 'collection' &&
			(this.isCollectionLocked ||
				(this.isInCrew && this.memberOptions.length > 1) ||
				!!this.#externalUserQuery.data)
	)

	#resolveMember(userId: string | undefined) {
		return resolveMember(
			userId,
			this.#crewMembers,
			this.#opts.authUserId(),
			this.#externalUserQuery.data ?? undefined
		)
	}

	readonly lockedMember = $derived.by(
		() =>
			this.#resolveMember(this.collectionSourceUserId) ?? {
				label: m.search_linked_user(),
				image: undefined
			}
	)

	readonly selectedMemberName = $derived.by(() => {
		if (!this.selectedMemberId || this.selectedMemberId === this.#opts.authUserId()) {
			return undefined
		}
		return this.#resolveMember(this.selectedMemberId)?.label
	})

	// --- Filters ---

	readonly filters = $derived.by(() =>
		buildSearchFilters({
			type: this.#opts.type(),
			searchMode: this.searchMode,
			elementFilters: this.elementFilters,
			rarityFilters: this.rarityFilters,
			proficiencyFilters: this.proficiencyFilters,
			requiredProficiencies: this.#opts.requiredProficiencies(),
			seriesFilter: this.seriesFilter,
			subauraFilter: this.subauraFilter,
			isExtraSlot: this.#opts.isExtraSlot()
		})
	)

	// --- Results ---

	readonly #isCollectionSearch = $derived.by(
		() => this.searchMode === 'collection' && !!this.#opts.authUserId()
	)

	readonly ownedIdSet = $derived.by(
		() => new SvelteSet<string>((this.#ownedIdsQuery.data as string[]) ?? [])
	)

	readonly searchResults = $derived.by<AddItemResult[]>(() => {
		if (this.#isCollectionSearch) {
			const pages = (this.#collectionQueryResult.data?.pages ?? []) as Array<{
				results: unknown[]
			}>
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			return (pages.flatMap((page) => page.results) as any[]).map(mapCollectionToSearchResult)
		}
		const pages = (this.#searchQueryResult.data?.pages ?? []) as Array<{
			results: AddItemResult[]
		}>
		return dedupeResultsById(pages.flatMap((page) => page.results))
	})

	readonly activeQuery = $derived.by(() =>
		this.#isCollectionSearch ? this.#collectionQueryResult : this.#searchQueryResult
	)

	readonly isEmpty = $derived(
		this.searchResults.length === 0 && !this.activeQuery.isLoading && !this.activeQuery.isError
	)

	// --- "In team" tracking ---

	readonly #inTeamCollectionIds = $derived(partyCollectionIds(partyStore.party))

	isInTeam(item: AddItemResult): boolean {
		if (!item.collectionId) return false
		return this.#inTeamCollectionIds.has(item.collectionId)
	}
}
