
<script lang="ts">
	import { createInfiniteQuery, createQuery } from '@tanstack/svelte-query'
	import { onDestroy } from 'svelte'
	import { searchQueries, type SearchFilters } from '$lib/api/queries/search.queries'
	import { collectionQueries } from '$lib/api/queries/collection.queries'
	import { entityQueries } from '$lib/api/queries/entity.queries'
	import { crewQueries } from '$lib/api/queries/crew.queries'
	import { partyStore } from '$lib/stores/partyStore.svelte'
	import { getAvatarSrc } from '$lib/utils/avatar'
	import { useInfiniteLoader } from '$lib/stores/loaderState.svelte'
	import { localizedName } from '$lib/utils/locale'
	import { getLocale } from '$lib/paraglide/runtime'
	import * as m from '$lib/paraglide/messages'
	import type { AddItemResult, SearchMode } from '$lib/types/api/search'
	import type {
		CollectionCharacter,
		CollectionWeapon,
		CollectionSummon
	} from '$lib/types/api/collection'

	import Button from '../ui/Button.svelte'
	import Icon from '../Icon.svelte'
	import Input from '../ui/Input.svelte'
	import SegmentedControl from '../ui/segmented-control/SegmentedControl.svelte'
	import Segment from '../ui/segmented-control/Segment.svelte'

	import Tooltip from '../ui/Tooltip.svelte'
	import SearchResultItem from './search/SearchResultItem.svelte'
	import SearchFiltersPanel from './search/SearchFiltersPanel.svelte'
	import CollectionMemberSelector from './search/CollectionMemberSelector.svelte'
	import UnlinkCollectionDialog from './search/UnlinkCollectionDialog.svelte'

	interface Props {
		type: 'weapon' | 'character' | 'summon'
		onAddItems?: (items: AddItemResult[]) => void
		canAddMore?: boolean
		/** User ID to enable collection search mode */
		authUserId?: string
		/** Required proficiencies for mainhand weapon selection */
		requiredProficiencies?: number[]
		/** User's element for styling the collection toggle */
		userElement?: 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'
		/** Callback to unlink all collection items from the party */
		onUnlinkCollection?: () => Promise<void>
	}

	let {
		type = 'weapon',
		onAddItems = () => {},
		canAddMore = true,
		authUserId,
		requiredProficiencies,
		userElement,
		onUnlinkCollection
	}: Props = $props()

	// Reactively derive collection source from party store (stays in sync after mutations)
	const collectionSourceUserId = $derived(partyStore.party?.collectionSourceUserId)

	// Search state (local UI state)
	let searchQuery = $state('')
	let debouncedSearchQuery = $state('')
	let debounceTimer: ReturnType<typeof setTimeout> | undefined
	let isComposing = $state(false)

	// Filter state
	let elementFilters = $state<number[]>([])
	let rarityFilters = $state<number[]>([])
	let proficiencyFilters = $state<number[]>([])
	let seriesFilter = $state<string | undefined>(undefined)

	// Search mode state (only available when authUserId is provided)
	// Default to 'collection' when a collection source is already set on the party
	const initialSourceUserId = partyStore.party?.collectionSourceUserId
	let searchMode = $state<SearchMode>(initialSourceUserId ? 'collection' : 'all')

	// Crew member selection state (defaults to self; collectionSourceUserId is reactive via partyStore)
	let selectedMemberId = $state<string | undefined>(authUserId)
	let unlinkDialogOpen = $state(false)

	// Filter visibility (open by default)
	let filtersOpen = $state(true)

	// Refs
	let sentinelEl = $state<HTMLElement>()

	// IME composition handlers
	function handleCompositionStart() {
		isComposing = true
	}

	function handleCompositionEnd() {
		// Safari fires compositionend before the final input event
		setTimeout(() => {
			isComposing = false
		}, 50)
	}

	// Debounce search query changes (skip during IME composition)
	$effect(() => {
		const query = searchQuery

		if (debounceTimer) {
			clearTimeout(debounceTimer)
		}

		if (isComposing) return

		debounceTimer = setTimeout(() => {
			debouncedSearchQuery = query
		}, 300)

		return () => {
			if (debounceTimer) {
				clearTimeout(debounceTimer)
			}
		}
	})

	// --- Queries ---

	// Series query - fetch list based on current type
	const seriesQuery = createQuery(() => {
		switch (type) {
			case 'weapon':
				return entityQueries.weaponSeriesList()
			case 'character':
				return entityQueries.characterSeriesList()
			case 'summon':
				return entityQueries.summonSeriesList()
		}
	})

	const seriesOptions = $derived.by(() => {
		const data = seriesQuery.data
		if (!data) return []
		return data.map((s) => ({
			value: s.id,
			label: localizedName(s.name)
		}))
	})

	// Check if user is in a crew (crewStore is only populated on /crew routes, so query directly)
	const myCrewQuery = createQuery(() => ({
		...crewQueries.myCrew(),
		enabled: !!authUserId
	}))
	const isInCrew = $derived(!!myCrewQuery.data)

	// Crew members with accessible collections (for collection mode dropdown)
	const crewMembersQuery = createQuery(() => ({
		...crewQueries.accessibleCollectionMembers(),
		enabled: isInCrew
	}))

	const memberOptions = $derived.by(() => {
		const members = crewMembersQuery.data ?? []
		const options: { value: string; label: string; image?: string; suffix?: string }[] = []

		if (authUserId) {
			const selfMember = members.find((m) => m.userId === authUserId)
			options.push({
				value: authUserId,
				label: selfMember?.username ?? 'You',
				image: selfMember ? getAvatarSrc(selfMember.avatarPicture) : undefined,
				suffix: 'You'
			})
		}

		for (const m of members) {
			if (m.userId !== authUserId) {
				options.push({
					value: m.userId,
					label: m.username,
					image: getAvatarSrc(m.avatarPicture)
				})
			}
		}

		return options
	})

	// --- Derived collection state ---

	const collectionUserId = $derived.by(() => {
		if (collectionSourceUserId) return collectionSourceUserId
		if (searchMode !== 'collection') return authUserId
		return selectedMemberId
	})

	const isCollectionLocked = $derived(!!collectionSourceUserId)

	const showMemberSection = $derived(
		searchMode === 'collection' &&
			(isCollectionLocked || (isInCrew && memberOptions.length > 1))
	)

	const lockedMember = $derived.by(() => {
		const lockedId = collectionSourceUserId
		if (!lockedId) return undefined
		const members = crewMembersQuery.data ?? []
		if (lockedId === authUserId) {
			const self = members.find((m) => m.userId === authUserId)
			return {
				label: self?.username ?? 'You',
				image: self ? getAvatarSrc(self.avatarPicture) : undefined
			}
		}
		const member = members.find((m) => m.userId === lockedId)
		return member
			? { label: member.username, image: getAvatarSrc(member.avatarPicture) }
			: { label: 'Linked user', image: undefined }
	})

	const selectedMemberName = $derived.by(() => {
		if (!selectedMemberId || selectedMemberId === authUserId) return undefined
		const members = crewMembersQuery.data ?? []
		return members.find((m) => m.userId === selectedMemberId)?.username
	})

	// --- Filters ---

	const effectiveProficiencies = $derived(
		requiredProficiencies ?? (proficiencyFilters.length > 0 ? proficiencyFilters : undefined)
	)

	const filters = $derived<SearchFilters>({
		element: elementFilters.length > 0 ? elementFilters : undefined,
		rarity: rarityFilters.length > 0 ? rarityFilters : undefined,
		proficiency:
			(type === 'weapon' || type === 'character') && effectiveProficiencies
				? effectiveProficiencies
				: undefined,
		series: seriesFilter ? [seriesFilter] : undefined
	})

	// --- Collection helpers ---

	function mapCollectionToSearchResult(
		item: CollectionCharacter | CollectionWeapon | CollectionSummon
	): AddItemResult {
		const entity =
			'character' in item ? item.character : 'weapon' in item ? item.weapon : item.summon
		return {
			id: entity.id,
			granblueId: entity.granblueId,
			name: entity.name,
			element: entity.element,
			rarity: entity.rarity,
			collectionId: item.id
		}
	}

	function filterCollectionByQuery<
		T extends CollectionCharacter | CollectionWeapon | CollectionSummon
	>(items: T[], query: string): T[] {
		if (!query.trim()) return items
		const lowerQuery = query.toLowerCase()
		return items.filter((item) => {
			const entity =
				'character' in item ? item.character : 'weapon' in item ? item.weapon : item.summon
			const name = entity.name
			const nameEn = typeof name === 'string' ? name : name?.en || ''
			const nameJa = typeof name === 'string' ? '' : name?.ja || ''
			return (
				nameEn.toLowerCase().includes(lowerQuery) || nameJa.toLowerCase().includes(lowerQuery)
			)
		})
	}

	// --- Search queries ---

	const searchQueryResult = createInfiniteQuery(() => {
		const query = debouncedSearchQuery
		const currentFilters = filters
		const locale = getLocale() as 'en' | 'ja'

		switch (type) {
			case 'weapon':
				return searchQueries.weapons(query, currentFilters, locale)
			case 'character':
				return searchQueries.characters(query, currentFilters, locale) as unknown as ReturnType<
					typeof searchQueries.weapons
				>
			case 'summon':
				return searchQueries.summons(query, currentFilters, locale) as unknown as ReturnType<
					typeof searchQueries.weapons
				>
		}
	})

	const collectionQueryResult = createInfiniteQuery(() => {
		const userId = collectionUserId
		if (!userId) {
			return {
				...collectionQueries.characters(userId ?? '', {}, false),
				enabled: false
			} as ReturnType<typeof collectionQueries.characters>
		}

		const currentFilters =
			searchMode === 'collection'
				? {
						element: elementFilters.length > 0 ? elementFilters : undefined,
						rarity: rarityFilters.length > 0 ? rarityFilters : undefined,
						proficiency: proficiencyFilters.length > 0 ? proficiencyFilters : undefined,
						series: seriesFilter ? [seriesFilter] : undefined
					}
				: {}

		switch (type) {
			case 'weapon':
				return {
					...collectionQueries.weapons(userId, currentFilters),
					enabled: true
				} as unknown as ReturnType<typeof collectionQueries.characters>
			case 'character':
				return {
					...collectionQueries.characters(userId, currentFilters),
					enabled: true
				}
			case 'summon':
				return {
					...collectionQueries.summons(userId, currentFilters),
					enabled: true
				} as unknown as ReturnType<typeof collectionQueries.characters>
		}
	})

	// --- Results processing ---

	const rawResults = $derived(
		searchQueryResult.data?.pages.flatMap((page) => page.results) ?? []
	)

	const rawCollectionResults = $derived.by(() => {
		const pages = collectionQueryResult.data?.pages ?? []
		const allItems = pages.flatMap((page) => page.results)
		return filterCollectionByQuery(allItems, debouncedSearchQuery)
	})

	const searchResults = $derived.by<AddItemResult[]>(() => {
		if (searchMode === 'collection' && authUserId) {
			return rawCollectionResults.map(mapCollectionToSearchResult)
		}
		const deduped = Array.from(new Map(rawResults.map((item) => [item.id, item])).values())
		return deduped as AddItemResult[]
	})

	const activeQuery = $derived(
		searchMode === 'collection' && authUserId ? collectionQueryResult : searchQueryResult
	)

	// --- "In team" tracking ---

	const inTeamCollectionIds = $derived.by(() => {
		const party = partyStore.party
		if (!party) return new Set<string>()
		const ids = new Set<string>()
		for (const w of party.weapons ?? []) {
			if (w.collectionWeaponId) ids.add(w.collectionWeaponId)
		}
		for (const c of party.characters ?? []) {
			if (c.collectionCharacterId) ids.add(c.collectionCharacterId)
		}
		for (const s of party.summons ?? []) {
			if (s.collectionSummonId) ids.add(s.collectionSummonId)
		}
		return ids
	})

	function isInTeam(item: AddItemResult): boolean {
		if (!item.collectionId) return false
		return inTeamCollectionIds.has(item.collectionId)
	}

	// --- Infinite scroll ---

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const loader = useInfiniteLoader(
		() => activeQuery as any,
		() => sentinelEl,
		{ rootMargin: '200px' }
	)

	$effect(() => {
		void searchMode
		void filters
		loader.reset()
	})

	onDestroy(() => loader.destroy())

	// --- Computed states ---

	const isEmpty = $derived(
		searchResults.length === 0 && !activeQuery.isLoading && !activeQuery.isError
	)

	function handleItemClick(item: AddItemResult) {
		if (canAddMore && !isInTeam(item)) {
			onAddItems([item])
		}
	}
</script>

<div class="search-content">
	<div class="controls">
		{#if authUserId}
			<div class="mode-toggle">
				<SegmentedControl
					value={searchMode}
					onValueChange={(v) => (searchMode = v as SearchMode)}
					variant="background"
					size="small"
					element={userElement}
					grow
				>
					<Segment value="all">{m.search_tab_all()}</Segment>
					<Segment value="collection">{m.search_tab_collection()}</Segment>
				</SegmentedControl>
			</div>
		{/if}

		{#if showMemberSection}
			<CollectionMemberSelector
				isLocked={isCollectionLocked}
				{lockedMember}
				{memberOptions}
				{selectedMemberId}
				onMemberChange={(id) => {
					selectedMemberId = id
				}}
				onUnlinkRequest={() => {
					unlinkDialogOpen = true
				}}
			/>
		{/if}

		<div class="search-section" class:filters-open={filtersOpen}>
			<Input
				bind:value={searchQuery}
				type="text"
				placeholder={m.search_placeholder()}
				leftIcon="search"
				contained
				fullWidth
				class="search-input"
				oncompositionstart={handleCompositionStart}
				oncompositionend={handleCompositionEnd}
			/>
		</div>

		{#if filtersOpen}
			<SearchFiltersPanel
				{type}
				{elementFilters}
				{rarityFilters}
				{proficiencyFilters}
				{seriesFilter}
				{seriesOptions}
				{requiredProficiencies}
				onElementChange={(v) => {
					elementFilters = v
				}}
				onRarityChange={(v) => {
					rarityFilters = v
				}}
				onProficiencyChange={(v) => {
					proficiencyFilters = v
				}}
				onSeriesChange={(v) => {
					seriesFilter = v
				}}
			/>
		{/if}

		<div class="filters-toggle">
			<Tooltip content={filtersOpen ? m.search_hide_filters() : m.search_show_filters()}>
				<Button
					variant="ghost"
					size="small"
					fullWidth
					onclick={() => {
						filtersOpen = !filtersOpen
					}}
				>
					<Icon name={filtersOpen ? 'chevron-up' : 'chevron-down'} size={14} />
				</Button>
			</Tooltip>
		</div>
	</div>

	<div class="results-section">
		{#if activeQuery.isLoading}
			<div class="loading">
				<Icon name="loader-2" size={24} />
				<span>{m.search_searching()}</span>
			</div>
		{:else if activeQuery.isError}
			<div class="error-state">
				<Icon name="alert-circle" size={24} />
				<p>{activeQuery.error?.message || m.search_failed()}</p>
				<Button size="small" onclick={() => activeQuery.refetch()}>{m.retry()}</Button>
			</div>
		{:else if searchResults.length > 0}
			<ul class="results-list">
				{#each searchResults as item (item.collectionId || item.id)}
					{@const inTeam = searchMode === 'collection' && isInTeam(item)}
					<SearchResultItem
						{item}
						{type}
						disabled={!canAddMore}
						fromCollection={!!item.collectionId}
						{inTeam}
						onclick={handleItemClick}
					/>
				{/each}
			</ul>

			<div
				class="load-more-sentinel"
				bind:this={sentinelEl}
				class:hidden={!activeQuery.hasNextPage}
			></div>

			{#if activeQuery.isFetchingNextPage}
				<div class="loading-more">
					<Icon name="loader-2" size={20} />
					<span>{m.search_loading_more()}</span>
				</div>
			{/if}
		{:else if isEmpty}
			<div class="no-results">
				{#if searchMode === 'collection'}
					{#if searchQuery.length > 0}
						{m.search_no_match()}
					{:else if selectedMemberName}
						{m.search_member_empty({ name: selectedMemberName })}
					{:else}
						{m.search_collection_empty()}
					{/if}
				{:else if searchQuery.length > 0}
					{m.search_no_results()}
				{:else}
					{m.search_start_typing()}
				{/if}
			</div>
		{/if}
	</div>
</div>

<UnlinkCollectionDialog
	bind:open={unlinkDialogOpen}
	onConfirm={async () => {
		if (onUnlinkCollection) await onUnlinkCollection()
	}}
/>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;

	.search-content {
		display: flex;
		flex-direction: column;
		height: calc(100vh - 60px);
		overflow: hidden;
	}

	.controls {
		display: flex;
		flex-direction: column;
		gap: $unit;
		padding: 0 $unit-2x;
		flex-shrink: 0;

		.search-section {
			&.filters-open {
				margin-bottom: $unit;
			}
		}

		:global(.search-input) {
			border-radius: $card-corner;
		}
	}

	.filters-toggle {
		flex-shrink: 0;
		padding-bottom: $unit-half;
		border-bottom: 1px solid var(--border-primary);

		> :global(span) {
			display: block;
			width: 100%;
		}

		:global(button) {
			justify-content: center;
			color: var(--text-tertiary);
			padding: $unit-half 0;
		}
	}

	.results-section {
		flex: 1;
		overflow-y: auto;
		padding: 0 $unit-2x;
		min-height: 0;

		.loading,
		.no-results {
			text-align: center;
			padding: $unit-3x;
			color: var(--text-secondary);
			font-size: $font-regular;
		}

		.results-list {
			display: flex;
			flex-direction: column;
			gap: $unit-half;
			list-style: none;
			padding: 0;
			margin: 0;
		}

		.loading {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: $unit;

			:global(svg) {
				animation: spin 1s linear infinite;
			}
		}

		.error-state {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			gap: $unit;
			padding: $unit-3x;
			color: var(--text-secondary);

			:global(svg) {
				color: var(--text-tertiary);
			}

			p {
				margin: 0;
				font-size: $font-regular;
			}
		}

		.load-more-sentinel {
			height: 1px;
			margin-top: $unit;

			&.hidden {
				display: none;
			}
		}

		.loading-more {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: $unit;
			padding: $unit-2x;
			color: var(--text-secondary);
			font-size: $font-regular;

			:global(svg) {
				animation: spin 1s linear infinite;
			}
		}
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
</style>
