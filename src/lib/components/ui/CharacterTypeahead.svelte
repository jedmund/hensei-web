<!-- CharacterTypeahead Component - Async character search with bits-ui Combobox -->

<script lang="ts">
	import { Combobox } from 'bits-ui'
	import { tick } from 'svelte'
	import Icon from '../Icon.svelte'
	import Button from './Button.svelte'
	import SearchOptionItem from '$lib/components/search/SearchOptionItem.svelte'
	import { searchAdapter, type SearchResult } from '$lib/api/adapters/search.adapter'
	import { localizedName, appLocale } from '$lib/utils/locale'
	import type { CharacterSeriesRef } from '$lib/types/api/characterSeries'

	interface CharacterOption {
		id: string
		label: string
		granblueId: string
		element?: number | null
		season?: number | null
		series?: (number | CharacterSeriesRef)[] | null
		styleSwap?: boolean
	}

	interface Props {
		/** Selected character granblue ID (e.g. "3040581000") */
		value?: string | null
		/** Initial character data for display (when loading existing value) */
		initialCharacter?: CharacterOption | null
		/** Search input value. Can be prefilled and bound independently from the selected value. */
		query?: string
		/** Callback when value changes */
		onValueChange?: (granblueId: string | null) => void
		/** Placeholder text */
		placeholder?: string
		/** Disabled state */
		disabled?: boolean
		/** Component size */
		size?: 'small' | 'medium' | 'large'
		/** Clear button visible */
		clearable?: boolean
		/** Minimum characters before search */
		minQuery?: number
		/** Use contained styling (for use inside containers) */
		contained?: boolean
	}

	let {
		value = $bindable(null),
		initialCharacter = null,
		query = $bindable(''),
		onValueChange,
		placeholder = 'Search characters...',
		disabled = false,
		size = 'medium',
		clearable = true,
		minQuery = 2,
		contained = false
	}: Props = $props()

	let searchResults = $state<CharacterOption[]>([])
	let isLoading = $state(false)
	let searchTimeout: ReturnType<typeof setTimeout> | null = null
	let comboboxOpen = $state(false)
	let initializedQuery = $state('')
	let inputElement = $state<HTMLInputElement | null>(null)

	// The selected granblueId used as the combobox value
	let selectedGranblueId = $state<string>(value ?? '')

	// Track the currently displayed character for the selection display
	let displayedCharacter = $state<CharacterOption | null>(null)

	// Sync external value changes into combobox and reset internal state
	$effect(() => {
		selectedGranblueId = value ?? ''

		if (!value) {
			displayedCharacter = null
		} else if (initialCharacter && initialCharacter.granblueId === value) {
			query = initialCharacter.label
			displayedCharacter = initialCharacter
		} else if (displayedCharacter?.granblueId !== value) {
			displayedCharacter = null
		}
	})

	// A prefilled query (used by Batch Import) should behave like typed search text,
	// but must not become a selected value until the editor chooses a result.
	$effect(() => {
		const nextQuery = query.trim()
		if (value || !nextQuery || nextQuery === initializedQuery) return

		initializedQuery = nextQuery
		if (searchTimeout) clearTimeout(searchTimeout)
		searchTimeout = setTimeout(() => searchCharacters(nextQuery), 300)
	})

	const comboboxItems = $derived(
		searchResults.map((c) => ({ value: c.granblueId, label: c.label }))
	)

	const wrapperClasses = $derived(
		['character-typeahead', size, contained && 'contained', disabled && 'disabled']
			.filter(Boolean)
			.join(' ')
	)

	async function searchCharacters(query: string) {
		if (query.length < minQuery) {
			searchResults = []
			return
		}

		isLoading = true
		try {
			const response = await searchAdapter.searchCharacters({
				query,
				per: 20,
				locale: appLocale()
			})

			searchResults = response.results.map((result: SearchResult) => ({
				id: result.id,
				label: localizedName(result.name) !== '—' ? localizedName(result.name) : result.granblueId,
				granblueId: result.granblueId,
				element: result.element,
				season: result.season,
				series: Array.isArray(result.series) ? result.series : null,
				styleSwap: result.styleSwap
			}))
			if (searchResults.length > 0) {
				comboboxOpen = true
			}
		} catch (error) {
			if (import.meta.env.DEV) {
				console.error('Character search error:', error)
			}
			searchResults = []
		} finally {
			isLoading = false
		}
	}

	function handleInputChange(val: string) {
		query = val
		initializedQuery = val.trim()
		if (searchTimeout) clearTimeout(searchTimeout)
		searchTimeout = setTimeout(() => searchCharacters(val), 300)

		if (!val.trim()) {
			selectedGranblueId = ''
			displayedCharacter = null
			value = null
			comboboxOpen = false
			onValueChange?.(null)
		}
	}

	function handleValueChange(granblueId: string) {
		selectedGranblueId = granblueId
		if (granblueId) {
			const match = searchResults.find((c) => c.granblueId === granblueId)
			if (match) {
				displayedCharacter = match
				query = match.label
				value = granblueId
				onValueChange?.(granblueId)
			}
		} else {
			displayedCharacter = null
			value = null
			onValueChange?.(null)
		}
		comboboxOpen = false
	}

	async function handleClear() {
		selectedGranblueId = ''
		query = ''
		initializedQuery = ''
		displayedCharacter = null
		searchResults = []
		value = null
		onValueChange?.(null)
		await tick()
		inputElement?.focus()
	}
</script>

<div class={wrapperClasses}>
	{#if displayedCharacter && value}
		<div class="selected-character">
			<SearchOptionItem
				label={displayedCharacter.label}
				granblueId={displayedCharacter.granblueId}
				type="Character"
				element={displayedCharacter.element ?? undefined}
				season={displayedCharacter.season}
				series={displayedCharacter.series}
				styleSwap={displayedCharacter.styleSwap}
				showType={false}
				imageSize={40}
			/>
			{#if clearable}
				<Button
					variant="ghost"
					size="small"
					iconOnly
					icon="close"
					onclick={handleClear}
					aria-label="Remove {displayedCharacter.label}"
					{disabled}
				/>
			{/if}
		</div>
	{:else}
		<Combobox.Root
			type="single"
			bind:value={selectedGranblueId}
			onValueChange={handleValueChange}
			bind:open={comboboxOpen}
			inputValue={query}
			items={comboboxItems}
			{disabled}
		>
			<div class="combobox-input-wrapper">
				<Combobox.Input
					bind:ref={inputElement}
					class="combobox-input"
					{placeholder}
					oninput={(e) => handleInputChange(e.currentTarget.value)}
					{disabled}
				/>
				{#if isLoading}
					<span class="input-loading">
						<Icon name="loader-2" size={14} />
					</span>
				{/if}
			</div>

			<Combobox.Content class="combobox-content">
				<Combobox.Viewport>
					{#each searchResults as character (character.granblueId)}
						<Combobox.Item
							value={character.granblueId}
							label={character.label}
							class="combobox-item"
						>
							{#snippet children({ selected })}
								<SearchOptionItem
									label={character.label}
									granblueId={character.granblueId}
									type="Character"
									element={character.element ?? undefined}
									season={character.season}
									series={character.series}
									styleSwap={character.styleSwap}
									showType={false}
									imageSize={40}
								/>
								{#if selected}
									<span class="item-check">
										<Icon name="check" size={14} />
									</span>
								{/if}
							{/snippet}
						</Combobox.Item>
					{/each}
				</Combobox.Viewport>
			</Combobox.Content>
		</Combobox.Root>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/colors' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/mixins' as *;
	@use '$src/themes/effects' as *;

	.character-typeahead {
		position: relative;
		width: 100%;

		&.disabled {
			opacity: 0.5;
			pointer-events: none;
		}
	}

	.combobox-input-wrapper {
		position: relative;
	}

	.selected-character {
		display: flex;
		align-items: center;
		gap: $unit;
		min-height: calc($unit * 6);
		padding: $unit;
		border-radius: $input-corner;
		background-color: var(--input-bg);

		:global(.option-item) {
			min-width: 0;
		}
	}

	.character-typeahead.contained .selected-character {
		background-color: var(--select-contained-bg);
	}

	:global(.character-typeahead .combobox-input) {
		all: unset;
		box-sizing: border-box;
		-webkit-font-smoothing: antialiased;
		background-color: var(--input-bg);
		border-radius: $input-corner;
		border: 1px solid transparent;
		color: var(--text-primary);
		display: block;
		font-family: var(--font-family);
		font-size: $font-regular;
		min-height: $unit-4x;
		padding: $unit calc($unit * 1.5);
		width: 100%;
		@include smooth-transition($duration-quick, background-color, border-color);

		&::placeholder {
			color: var(--text-tertiary);
			opacity: 1;
		}

		&:hover {
			background-color: var(--input-bg-hover);
		}

		&:focus {
			border-color: $blue;
		}

		&:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
	}

	// Contained variant
	.character-typeahead.contained :global(.combobox-input) {
		background-color: var(--select-contained-bg);

		&:hover {
			background-color: var(--select-contained-bg-hover);
		}
	}

	.input-loading {
		position: absolute;
		right: $unit-2x;
		top: 50%;
		transform: translateY(-50%);
		color: var(--text-tertiary);
		display: flex;
		align-items: center;
		pointer-events: none;

		:global(svg) {
			animation: spin 1s linear infinite;
		}
	}

	// Dropdown
	:global(.character-typeahead .combobox-content) {
		background: var(--dialog-bg);
		border-radius: $card-corner;
		border: 1px solid rgba(0, 0, 0, 0.1);
		box-shadow: var(--shadow-lg);
		padding: $unit-half;
		min-width: var(--bits-combobox-anchor-width);
		max-height: 40vh;
		overflow: auto;
		z-index: $z-modal + 2;
		animation: fadeIn $duration-opacity-fade ease-out;
	}

	// Items
	:global(.character-typeahead .combobox-item) {
		align-items: center;
		border-radius: $item-corner-small;
		color: var(--text-primary);
		cursor: pointer;
		display: flex;
		gap: $unit;
		padding: $unit $unit-2x;
		user-select: none;
		@include smooth-transition($duration-quick, background-color);

		&:hover,
		&[data-highlighted] {
			background-color: var(--option-bg-hover);
		}

		&[data-selected] {
			font-weight: $medium;
		}
	}

	.item-check {
		margin-left: auto;
		color: var(--accent-color);
	}

	// Size variants
	.character-typeahead.small :global(.combobox-input) {
		min-height: $unit-3x;
		font-size: $font-small;
	}

	.character-typeahead.large :global(.combobox-input) {
		min-height: calc($unit * 6);
		font-size: $font-large;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(-4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
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
