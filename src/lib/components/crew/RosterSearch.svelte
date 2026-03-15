
<script lang="ts">
	import {
		searchAdapter,
		type UnifiedSearchResult,
		type UnifiedSearchSeriesRef
	} from '$lib/api/adapters/search.adapter'
	import Input from '$lib/components/ui/Input.svelte'
	import SearchOptionItem from '$lib/components/search/SearchOptionItem.svelte'
	import * as m from '$lib/paraglide/messages'
	import { getLocale } from '$lib/paraglide/runtime'
	import { extractErrorMessage } from '$lib/utils/errors'
	import { toast } from 'svelte-sonner'

	type ItemType = 'Character' | 'Weapon' | 'Summon'

	export interface RosterSearchResult {
		id: string
		granblueId: string
		name: string
		type: ItemType
		element?: number
		season?: number | null
		series?: UnifiedSearchSeriesRef[] | null
	}

	interface Props {
		onSelect: (result: RosterSearchResult) => void
		placeholder?: string
	}

	let { onSelect, placeholder = m.crew_roster_search() }: Props = $props()

	let inputValue = $state('')
	let dropdownOpen = $state(false)
	let containerEl = $state<HTMLDivElement>()
	let listEl = $state<HTMLUListElement>()
	let selectedIndex = $state(0)
	let searchResults = $state<UnifiedSearchResult[]>([])
	let isSearching = $state(false)
	let isComposing = $state(false)
	let searchTimeout: ReturnType<typeof setTimeout> | null = null

	interface DisplayResult {
		id: string
		granblueId: string
		label: string
		type: ItemType
		element?: number
		season?: number | null
		series?: UnifiedSearchSeriesRef[] | null
	}

	const displayResults = $derived<DisplayResult[]>(
		searchResults.map((r) => ({
			id: r.searchableId,
			granblueId: r.granblueId,
			label: r.nameEn || 'Unknown',
			type: r.searchableType,
			element: r.element,
			season: r.season,
			series: r.series
		}))
	)

	$effect(() => {
		void displayResults
		selectedIndex = 0
	})

	$effect(() => {
		const item = listEl?.children[selectedIndex] as HTMLElement | undefined
		item?.scrollIntoView({ block: 'nearest' })
	})

	$effect(() => {
		if (!isComposing) searchEntities(inputValue)
	})

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
					per: 20,
					locale: getLocale() as 'en' | 'ja'
				})
				searchResults = response.results ?? []
			} catch (error) {
				toast.error(extractErrorMessage(error, 'Search failed'))
				searchResults = []
			} finally {
				isSearching = false
			}
		}, 300)
	}

	function selectResult(result: DisplayResult) {
		onSelect({
			id: result.id,
			granblueId: result.granblueId,
			name: result.label,
			type: result.type,
			element: result.element,
			season: result.season,
			series: result.series
		})
		inputValue = ''
		searchResults = []
		dropdownOpen = false
	}

	function handleFocus() {
		dropdownOpen = true
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.isComposing || e.keyCode === 229) return

		if (e.key === 'ArrowDown') {
			e.preventDefault()
			selectedIndex = Math.min(selectedIndex + 1, displayResults.length - 1)
		} else if (e.key === 'ArrowUp') {
			e.preventDefault()
			selectedIndex = Math.max(selectedIndex - 1, 0)
		} else if (e.key === 'Enter') {
			e.preventDefault()
			const result = displayResults[selectedIndex]
			if (result) selectResult(result)
		} else if (e.key === 'Escape') {
			dropdownOpen = false
			;(document.activeElement as HTMLElement)?.blur()
		}
	}

	function handleWindowClick(e: MouseEvent) {
		const target = e.target as Node
		if (!target.isConnected) return
		if (containerEl && !containerEl.contains(target)) {
			dropdownOpen = false
		}
	}
</script>

<svelte:window onclick={handleWindowClick} />

<div class="roster-search" bind:this={containerEl}>
	<Input
		bind:value={inputValue}
		contained
		fullWidth
		{placeholder}
		handleFocus={handleFocus}
		onkeydown={handleKeydown}
		oncompositionstart={() => (isComposing = true)}
		oncompositionend={(e) => {
			setTimeout(() => {
				isComposing = false
				searchEntities((e.target as HTMLInputElement)?.value ?? '')
			}, 50)
		}}
	/>

	{#if dropdownOpen && (displayResults.length > 0 || isSearching || inputValue.length >= 2)}
		<div class="dropdown">
			<ul class="results" role="listbox" bind:this={listEl}>
				{#if displayResults.length > 0}
					{#each displayResults as result, i (result.id + result.type)}
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<li
							class="result-item"
							class:selected={i === selectedIndex}
							role="option"
							aria-selected={i === selectedIndex}
							onmouseenter={() => (selectedIndex = i)}
							onclick={() => selectResult(result)}
						>
							<SearchOptionItem
								label={result.label}
								granblueId={result.granblueId}
								type={result.type}
								element={result.element}
								season={result.season}
								series={result.series}
								imageSize={36}
							/>
						</li>
					{/each}
				{:else if isSearching}
					<li class="result-item empty">
						<span class="result-label">{m.explore_searching()}</span>
					</li>
				{:else}
					<li class="result-item empty">
						<span class="result-label">{m.explore_no_results()}</span>
					</li>
				{/if}
			</ul>
		</div>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/effects' as *;
	@use '$src/themes/mixins' as *;

	.roster-search {
		position: relative;
	}

	.dropdown {
		position: absolute;
		top: calc(100% + $unit-half);
		left: 0;
		right: 0;
		background: var(--menu-bg);
		border: $card-border;
		border-radius: $card-corner;
		box-shadow: $dialog-elevation;
		z-index: $z-popover;
		overflow: hidden;
	}

	.results {
		list-style: none;
		margin: 0;
		padding: $unit-half;
		max-height: 40vh;
		overflow-y: auto;
	}

	.result-item {
		display: flex;
		align-items: center;
		padding: $unit-half $unit;
		border-radius: $item-corner;
		cursor: pointer;
		color: var(--text-primary);
		@include smooth-transition($duration-quick, background);

		&:hover,
		&.selected {
			background: var(--menu-bg-item-hover);
		}

		&.empty {
			cursor: default;
			color: var(--text-tertiary);
			justify-content: center;
			padding: $unit-2x;
		}
	}

	.result-label {
		font-size: $font-small;
		color: var(--text-tertiary);
	}
</style>
