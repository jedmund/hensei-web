<script lang="ts">
	import { searchAdapter } from '$lib/api/adapters/search.adapter'
	import type { UnifiedSearchResult } from '$lib/api/adapters/search.adapter'
	import type { RaidFull } from '$lib/types/api/raid'
	import type { FilterItem, FilterOption, PlaceholderSuggestion } from '$lib/types/filter'
	import { createQuery } from '@tanstack/svelte-query'
	import { difficultyQueries } from '$lib/api/queries/difficulty.queries'
	import { matchLocal, rankResults } from '$lib/utils/filterMatching'
	import ExploreFilterPill from './ExploreFilterPill.svelte'
	import FilterDropdown from './FilterDropdown.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Input from '$lib/components/ui/Input.svelte'
	import BottomSheet from '$lib/components/ui/BottomSheet.svelte'
	import Switch from '$lib/components/ui/switch/Switch.svelte'
	import * as m from '$lib/paraglide/messages'
	import { getLocale } from '$lib/paraglide/runtime'
	import { localizedName } from '$lib/utils/locale'
	import { getElementOptions } from '$lib/utils/element'
	import {
		getRecencyOptions,
		getPartyOptions,
		getBoostOptions,
		getSideOptions
	} from '$lib/utils/exploreFilterOptions'
	import { MediaQuery } from 'svelte/reactivity'

	type ElementName = 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'

	interface Props {
		filters: FilterItem[]
		onFiltersChange: (filters: FilterItem[]) => void
		excludedKinds?: FilterItem['kind'][]
		/** Use when placed on a card/white surface — gives the pill a visible background */
		contained?: boolean
		allRaids?: RaidFull[]
		/** Mobile-only: collection filter state */
		collectionFilterActive?: boolean
		onCollectionFilterChange?: (active: boolean) => void
		/** Mobile-only: open the advanced filters modal */
		onAdvancedFiltersOpen?: () => void
		/** User's element for theming */
		element?: ElementName
		/** Whether the user is authenticated (controls collection filter visibility) */
		isAuthenticated?: boolean
	}

	let {
		filters = $bindable([]),
		onFiltersChange,
		excludedKinds = [],
		contained = false,
		allRaids = [],
		collectionFilterActive = $bindable(false),
		onCollectionFilterChange,
		onAdvancedFiltersOpen,
		element,
		isAuthenticated = false
	}: Props = $props()

	const isMobile = new MediaQuery('(max-width: 768px)')

	let inputValue = $state('')
	let dropdownOpen = $state(false)
	let inputEl = $state<HTMLInputElement>()
	let containerEl = $state<HTMLDivElement>()
	let selectedIndex = $state(0)
	let searchResults = $state<UnifiedSearchResult[]>([])
	let isSearching = $state(false)
	let isComposing = $state(false)
	let searchTimeout: ReturnType<typeof setTimeout> | null = null

	// Static filter options
	const elementOptions = $derived(getElementOptions())
	const recencyOptions = $derived(getRecencyOptions())
	const partyOptions = $derived(getPartyOptions())
	const boostOptions = $derived(getBoostOptions())
	const sideOptions = $derived(getSideOptions())

	// Difficulty tiers fetched from API; refreshed on staleness
	const difficultyTiersQuery = createQuery(() => difficultyQueries.tiers())
	const difficultyOptions = $derived(
		(difficultyTiersQuery.data ?? []).map((tier) => ({
			value: tier.slug,
			label: tier.name
		}))
	)

	// When filters are restored from a URL (?difficulty=casual,mid), pills land
	// with label === value because the tier list hasn't loaded yet. Once it
	// settles, replace those placeholder labels with the resolved tier name.
	$effect(() => {
		const tiers = difficultyTiersQuery.data
		if (!tiers || tiers.length === 0) return
		let changed = false
		const next = filters.map((f) => {
			if (f.kind !== 'difficulty' || f.label !== f.value) return f
			const tier = tiers.find((t) => t.slug === f.value)
			if (!tier) return f
			changed = true
			return { ...f, label: tier.name }
		})
		if (changed) {
			filters = next
			onFiltersChange(filters)
		}
	})

	const categoryLabels = $derived({
		element: m.filter_cat_element(),
		recency: m.filter_cat_recency(),
		party: m.filter_cat_party(),
		raid: m.filter_cat_raid(),
		boost: m.filter_cat_boost(),
		side: m.filter_cat_side(),
		difficulty: m.filter_cat_difficulty()
	})

	// Suggestion pools per category
	const elementSuggestions = $derived<FilterOption[]>(
		elementOptions
			.filter((e) => e.value !== 0)
			.map((e) => ({
				kind: 'element',
				value: e.value,
				label: e.label,
				category: categoryLabels.element
			}))
	)

	function pickRandom<T>(arr: T[]): T | undefined {
		if (arr.length === 0) return undefined
		return arr[Math.floor(Math.random() * arr.length)]
	}

	let placeholderSuggestions = $state<PlaceholderSuggestion[]>([])

	async function refreshSuggestions() {
		const picks: PlaceholderSuggestion[] = []

		if (!excludedKinds.includes('element')) {
			const el = pickRandom(elementSuggestions)
			if (el) picks.push({ label: el.label, category: categoryLabels.element, option: el })
		}

		if (!excludedKinds.includes('raid')) {
			const raidPool = allRaids.filter(
				(r) => !filters.some((f) => f.kind === 'raid' && f.value === r.id)
			)
			const raid = pickRandom(raidPool)
			if (raid) {
				const opt: FilterOption = {
					kind: 'raid',
					value: raid.id,
					label: localizedName(raid.name) ?? raid.slug,
					category: categoryLabels.raid
				}
				picks.push({ label: opt.label, category: categoryLabels.raid, option: opt })
			}
		}

		if (!excludedKinds.includes('recency')) {
			picks.push({
				label: m.recency_week(),
				category: categoryLabels.recency,
				option: {
					kind: 'recency',
					value: 604800,
					label: m.recency_week(),
					category: categoryLabels.recency
				}
			})
		}

		if (!excludedKinds.includes('entity')) {
			try {
				const { suggestions } = await searchAdapter.getRandomSuggestions()
				const entity = pickRandom(suggestions)
				if (entity) {
					const category =
						entity.type === 'character'
							? m.filter_cat_character()
							: entity.type === 'weapon'
								? m.filter_cat_weapon()
								: m.filter_cat_summon()
					const entityLabel = localizedName(entity.name as { en: string; ja: string }) ?? 'Unknown'
					picks.push({
						label: entityLabel,
						category,
						option: {
							kind: 'entity',
							value: entity.id,
							label: entityLabel,
							category,
							entityType: entity.type,
							granblueId: entity.granblueId,
							element: entity.element
						}
					})
				}
			} catch {
				// Non-critical — other suggestions still show
			}
		}

		if (!excludedKinds.includes('party')) {
			picks.push({
				label: m.filter_full_auto(),
				category: categoryLabels.party,
				option: {
					kind: 'party',
					value: 'full_auto',
					label: m.filter_full_auto(),
					category: categoryLabels.party
				}
			})
			picks.push({
				label: m.filter_solo(),
				category: categoryLabels.party,
				option: {
					kind: 'party',
					value: 'solo',
					label: m.filter_solo(),
					category: categoryLabels.party
				}
			})
			picks.push({
				label: m.filter_youtube(),
				category: categoryLabels.party,
				option: {
					kind: 'party',
					value: 'youtube',
					label: m.filter_youtube(),
					category: categoryLabels.party
				}
			})
		}

		placeholderSuggestions = picks
	}

	// Debounced API search
	function searchEntities(query: string) {
		if (searchTimeout) clearTimeout(searchTimeout)

		if (query.length < 2) {
			searchResults = []
			isSearching = false
			return
		}

		isSearching = true
		searchTimeout = setTimeout(async () => {
			try {
				const response = await searchAdapter.searchAll({
					query,
					per: 10,
					locale: getLocale() as 'en' | 'ja'
				})
				searchResults = response.results ?? []
			} catch {
				searchResults = []
			} finally {
				isSearching = false
			}
		}, 300)
	}

	// Combined results: local + API
	const displayResults = $derived.by((): FilterOption[] => {
		if (!dropdownOpen || !inputValue.trim()) return []

		const local = matchLocal({
			query: inputValue,
			filters,
			excludedKinds,
			elementOptions,
			recencyOptions,
			partyOptions,
			boostOptions,
			sideOptions,
			difficultyOptions,
			allRaids,
			categoryLabels
		})

		const apiResults: FilterOption[] = searchResults
			.filter((r) => !filters.some((f) => f.kind === 'entity' && f.granblueId === r.granblueId))
			.map((r) => {
				const type = r.searchableType.toLowerCase()
				const category =
					type === 'character'
						? m.filter_cat_character()
						: type === 'weapon'
							? m.filter_cat_weapon()
							: m.filter_cat_summon()
				return {
					kind: 'entity' as const,
					value: r.searchableId,
					label: localizedName({ en: r.nameEn ?? '', ja: r.nameJp ?? '' }) ?? 'Unknown',
					category,
					entityType: type,
					granblueId: r.granblueId,
					element: r.element,
					season: r.season,
					series: r.series
				}
			})

		return rankResults([...local, ...apiResults], inputValue.trim().toLowerCase())
	})

	// Reset selected index when results change
	$effect(() => {
		void displayResults
		selectedIndex = 0
	})

	// Trigger search on input change (skip during IME composition)
	$effect(() => {
		if (!isComposing) searchEntities(inputValue)
	})

	function openDropdown() {
		refreshSuggestions()
		dropdownOpen = true
		requestAnimationFrame(() => inputEl?.focus())
	}

	function closeDropdown() {
		dropdownOpen = false
		inputValue = ''
		searchResults = []
	}

	function isAlreadySelected(option: FilterOption): boolean {
		return filters.some((f) => {
			if (f.kind !== option.kind) return false
			if (f.kind === 'entity') return f.granblueId === option.granblueId
			return f.value === option.value
		})
	}

	// Single-select kinds replace existing filter of the same kind
	const singleSelectKinds = new Set(['recency', 'boost', 'side'])

	function selectOption(option: FilterOption) {
		if (isAlreadySelected(option)) return

		let newFilter: FilterItem

		if (option.kind === 'entity') {
			newFilter = {
				kind: 'entity',
				value: option.value as string,
				label: option.label,
				entityType: option.entityType!,
				granblueId: option.granblueId!,
				mode: 'include',
				element: option.element
			}
		} else if (option.kind === 'element') {
			newFilter = { kind: 'element', value: option.value as number, label: option.label }
		} else if (singleSelectKinds.has(option.kind)) {
			const without = filters.filter((f) => f.kind !== option.kind)
			newFilter = { kind: option.kind, value: option.value, label: option.label } as FilterItem
			filters = [...without, newFilter]
			onFiltersChange(filters)
			inputValue = ''
			searchResults = []
			return
		} else if (option.kind === 'raid') {
			newFilter = { kind: 'raid', value: option.value as string, label: option.label }
		} else if (option.kind === 'class') {
			newFilter = { kind: 'class', value: option.value as string, label: option.label }
		} else if (option.kind === 'difficulty') {
			newFilter = {
				kind: 'difficulty',
				value: option.value as string,
				label: option.label
			}
		} else {
			newFilter = { kind: 'party', value: option.value as string, label: option.label }
		}

		filters = [...filters, newFilter]
		onFiltersChange(filters)
		inputValue = ''
		searchResults = []
	}

	function removeFilter(index: number) {
		if (filters[index]?.pinned) return
		filters = filters.filter((_, i) => i !== index)
		onFiltersChange(filters)
	}

	function toggleEntityMode(index: number) {
		const filter = filters[index]
		if (!filter || filter.kind !== 'entity') return
		const updated: FilterItem[] = [...filters]
		updated[index] = { ...filter, mode: filter.mode === 'include' ? 'exclude' : 'include' }
		filters = updated
		onFiltersChange(filters)
	}

	function handleCompositionStart() {
		isComposing = true
		if (searchTimeout) clearTimeout(searchTimeout)
	}

	function handleCompositionEnd(e: CompositionEvent) {
		setTimeout(() => {
			isComposing = false
			const value = (e.target as HTMLInputElement)?.value ?? ''
			searchEntities(value)
		}, 50)
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.isComposing || e.keyCode === 229) return

		const isPlaceholder = !inputValue.trim()
		const listLength = isPlaceholder ? placeholderSuggestions.length : displayResults.length

		if (e.key === 'ArrowDown') {
			e.preventDefault()
			selectedIndex = Math.min(selectedIndex + 1, listLength - 1)
		} else if (e.key === 'ArrowUp') {
			e.preventDefault()
			selectedIndex = Math.max(selectedIndex - 1, 0)
		} else if (e.key === 'Enter') {
			e.preventDefault()
			if (isPlaceholder) {
				const suggestion = placeholderSuggestions[selectedIndex]
				if (suggestion?.option) selectOption(suggestion.option)
			} else {
				const option = displayResults[selectedIndex]
				if (option) selectOption(option)
			}
		} else if (e.key === 'Escape') {
			closeDropdown()
		} else if (e.key === 'Backspace' && inputValue === '' && filters.length > 0) {
			for (let i = filters.length - 1; i >= 0; i--) {
				if (!filters[i]?.pinned) {
					removeFilter(i)
					break
				}
			}
		}
	}

	// Mobile gear sheet state
	let gearSheetOpen = $state(false)

	function handleWindowClick(e: MouseEvent) {
		const target = e.target as Node
		if (!target.isConnected) return
		if (containerEl && !containerEl.contains(target)) {
			closeDropdown()
		}
	}
</script>

<svelte:window onclick={handleWindowClick} />

<div
	class="explore-filters"
	class:contained
	class:mobile={isMobile.current}
	bind:this={containerEl}
>
	{#if isMobile.current}
		<!-- Mobile layout: full-width input + gear button -->
		<div class="mobile-filter-row">
			<div class="mobile-input-wrapper">
				<Input
					leftIcon="search"
					placeholder={m.explore_filter_placeholder_mobile()}
					bind:value={inputValue}
					fullWidth
					size="medium"
					onfocus={openDropdown}
					onkeydown={handleKeydown}
					oncompositionstart={handleCompositionStart}
					oncompositionend={handleCompositionEnd}
				/>
			</div>
			<Button
				icon="gear"
				iconOnly
				shape="circle"
				variant="subtle"
				onclick={() => (gearSheetOpen = true)}
				aria-label={m.explore_settings_aria()}
			/>
		</div>

		{#if filters.length > 0}
			<div class="mobile-pills-row">
				{#each filters as filter, i (i)}
					{@const pillElement =
						filter.kind === 'entity'
							? filter.element
							: filter.kind === 'element'
								? filter.value
								: undefined}
					<ExploreFilterPill
						label={filter.label}
						kind={filter.kind}
						mode={filter.kind === 'entity' ? filter.mode : undefined}
						element={pillElement}
						pinned={filter.pinned}
						onRemove={() => removeFilter(i)}
						onToggleMode={() => toggleEntityMode(i)}
					/>
				{/each}
			</div>
		{/if}

		{#if dropdownOpen}
			<FilterDropdown
				{inputValue}
				{isSearching}
				{placeholderSuggestions}
				{displayResults}
				{selectedIndex}
				onSelectedIndexChange={(i) => (selectedIndex = i)}
				onSelectOption={selectOption}
				onSuggestionClick={(s) => {
					if (s.option) selectOption(s.option)
				}}
			/>
		{/if}

		<BottomSheet bind:open={gearSheetOpen}>
			<div class="gear-sheet">
				{#if isAuthenticated}
					<div class="gear-sheet-row">
						<span class="gear-sheet-label">{m.explore_collection_only()}</span>
						<Switch
							checked={collectionFilterActive}
							onCheckedChange={(checked) => {
								collectionFilterActive = checked
								onCollectionFilterChange?.(checked)
							}}
							size="small"
							{element}
						/>
					</div>
					<hr class="gear-sheet-separator" />
				{/if}
				<button
					class="gear-sheet-row gear-sheet-button"
					onclick={() => {
						gearSheetOpen = false
						onAdvancedFiltersOpen?.()
					}}
				>
					<span class="gear-sheet-label">{m.explore_advanced_filters()}</span>
					<Icon name="chevron-right" size={16} />
				</button>
			</div>
		</BottomSheet>
	{:else}
		<!-- Desktop layout: existing filter trigger + inline pills -->
		<div class="filter-row">
			{#if dropdownOpen}
				<div class="filter-input-wrapper">
					<input
						bind:this={inputEl}
						bind:value={inputValue}
						type="text"
						class="filter-input"
						placeholder={m.explore_filter_placeholder()}
						onkeydown={handleKeydown}
						oncompositionstart={handleCompositionStart}
						oncompositionend={handleCompositionEnd}
					/>
				</div>
			{:else}
				<button type="button" class="filter-trigger" onclick={openDropdown}>
					<span>{m.explore_filter()}</span>
					<Icon name="plus" size={9} />
				</button>

				{#if filters.length === 0}
					<span class="tagline">{m.explore_filter_tagline()}</span>
				{/if}
			{/if}

			{#each filters as filter, i (i)}
				{@const pillElement =
					filter.kind === 'entity'
						? filter.element
						: filter.kind === 'element'
							? filter.value
							: undefined}
				<ExploreFilterPill
					label={filter.label}
					kind={filter.kind}
					mode={filter.kind === 'entity' ? filter.mode : undefined}
					element={pillElement}
					pinned={filter.pinned}
					onRemove={() => removeFilter(i)}
					onToggleMode={() => toggleEntityMode(i)}
				/>
			{/each}
		</div>

		{#if dropdownOpen}
			<FilterDropdown
				{inputValue}
				{isSearching}
				{placeholderSuggestions}
				{displayResults}
				{selectedIndex}
				onSelectedIndexChange={(i) => (selectedIndex = i)}
				onSelectOption={selectOption}
				onSuggestionClick={(s) => {
					if (s.option) selectOption(s.option)
				}}
			/>
		{/if}
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/effects' as *;

	@property --aura-angle {
		syntax: '<angle>';
		initial-value: 180deg;
		inherits: false;
	}

	.explore-filters {
		position: relative;

		&.mobile {
			width: 100%;
		}

		// Aura gradient colors — bright pastels for light, muted for dark
		--aura-1: #f9c4d2;
		--aura-2: #b8e6d0;
		--aura-3: #b3d4f7;
		--aura-4: #e0b3f7;
		--aura-5: #f7d6b3;

		:global(html[data-theme='dark']) & {
			--aura-1: #7a3a4a;
			--aura-2: #2a5a3f;
			--aura-3: #2a4a6a;
			--aura-4: #5a2a6a;
			--aura-5: #6a4a2a;
		}
	}

	.filter-row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: $unit;
	}

	.tagline {
		font-size: $font-small;
		color: var(--text-secondary);
	}

	.filter-trigger {
		all: unset;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		gap: $unit-half;
		padding: calc($unit-half + 1px) $unit;
		border-radius: $full-corner;
		font-size: $font-small;
		color: var(--text-primary);
		position: relative;

		// Gradient aura (behind everything)
		&::before {
			content: '';
			position: absolute;
			inset: -6px;
			border-radius: $full-corner;
			background: conic-gradient(
				from var(--aura-angle, 180deg),
				var(--aura-1),
				var(--aura-2),
				var(--aura-3),
				var(--aura-4),
				var(--aura-5),
				var(--aura-1)
			);
			opacity: 0;
			z-index: $z-base;
			filter: blur(12px);
			@include smooth-transition($duration-quick, opacity);
		}

		// White pill background (above gradient, below text)
		&::after {
			content: '';
			position: absolute;
			inset: 0;
			border-radius: inherit;
			background: var(--card-bg);
			z-index: $z-raised;
		}

		&:hover::before {
			opacity: 0.8;
			animation:
				spin-aura 8s linear infinite,
				breathe-aura 6s ease-in-out infinite;
		}

		// Ensure text and icon sit above the ::after background
		:global(> *) {
			position: relative;
			z-index: $z-badge;
		}

		:global(.icon) {
			color: var(--text-secondary);
		}

		.contained & {
			&::after {
				border: 1px solid var(--stroked-button-border);
			}
		}
	}

	@keyframes spin-aura {
		to {
			--aura-angle: 540deg;
		}
	}

	@keyframes breathe-aura {
		0%,
		100% {
			inset: -6px;
			filter: blur(12px);
		}
		50% {
			inset: -14px;
			filter: blur(20px);
		}
	}

	.filter-input-wrapper {
		position: relative;
		display: inline-flex;
		border-radius: $full-corner;

		// Gradient aura (same as filter-trigger)
		&::before {
			content: '';
			position: absolute;
			inset: -6px;
			border-radius: $full-corner;
			background: conic-gradient(
				from var(--aura-angle, 180deg),
				var(--aura-1),
				var(--aura-2),
				var(--aura-3),
				var(--aura-4),
				var(--aura-5),
				var(--aura-1)
			);
			opacity: 0.8;
			z-index: $z-base;
			filter: blur(12px);
			animation:
				spin-aura 8s linear infinite,
				breathe-aura 6s ease-in-out infinite;
		}

		// White pill background with stroke
		&::after {
			content: '';
			position: absolute;
			inset: 0;
			border-radius: inherit;
			background: var(--card-bg);
			box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.01);
			z-index: $z-raised;
		}

		.contained & {
			&::after {
				border: 1px solid var(--stroked-button-border);
			}
		}
	}

	.filter-input {
		all: unset;
		padding: calc($unit-half + 1px) $unit;
		border-radius: $full-corner;
		font-size: $font-small;
		color: var(--text-primary);
		min-width: 120px;
		box-sizing: border-box;
		position: relative;
		z-index: $z-badge;

		&::placeholder {
			color: var(--text-tertiary);
		}
	}

	// Mobile layout styles
	.mobile-filter-row {
		display: flex;
		align-items: center;
		gap: $unit;
	}

	.mobile-input-wrapper {
		flex: 1;
		min-width: 0;

		:global(.fieldset .input) {
			min-height: calc($unit * 5.5);
		}
	}

	.mobile-pills-row {
		display: flex;
		flex-wrap: wrap;
		gap: $unit-half;
		margin-top: $unit;
	}

	// Gear sheet styles
	.gear-sheet {
		display: flex;
		flex-direction: column;
	}

	.gear-sheet-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: calc($unit * 1.5) $unit;
	}

	.gear-sheet-button {
		background: none;
		border: none;
		cursor: pointer;
		font-family: var(--font-family);
		border-radius: $card-corner;
		color: var(--text-primary);

		&:hover {
			background: var(--menu-bg-item-hover);
		}
	}

	.gear-sheet-label {
		font-size: $font-regular;
		font-weight: $medium;
		color: var(--text-primary);
	}

	.gear-sheet-separator {
		border: none;
		height: 2px;
		background-color: var(--separator-bg);
		border-radius: 1px;
		margin: $unit-half 0;
	}
</style>
