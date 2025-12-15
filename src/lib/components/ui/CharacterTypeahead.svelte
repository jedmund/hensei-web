<!-- CharacterTypeahead Component - Async character search with Svelecte -->
<svelte:options runes={true} />

<script lang="ts">
	import Svelecte from 'svelecte'
	import Icon from '../Icon.svelte'
	import { searchAdapter, type SearchResult } from '$lib/api/adapters/search.adapter'

	interface CharacterOption {
		id: string
		label: string
		granblueId: string
		element?: number
	}

	interface Props {
		/** Selected character granblue ID (e.g. "3040581000") */
		value?: string | null
		/** Initial character data for display (when loading existing value) */
		initialCharacter?: { id: string; name: string; granblueId: string } | null
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
		onValueChange,
		placeholder = 'Search characters...',
		disabled = false,
		size = 'medium',
		clearable = true,
		minQuery = 2,
		contained = false
	}: Props = $props()

	// Initialize selectedOption from initialCharacter if provided
	function initializeFromCharacter() {
		if (initialCharacter && value) {
			return {
				id: initialCharacter.id,
				label: initialCharacter.name,
				granblueId: initialCharacter.granblueId
			}
		}
		return null
	}

	let searchResults = $state<CharacterOption[]>([])
	let selectedOption = $state<CharacterOption | null>(initializeFromCharacter())
	let isLoading = $state(false)
	let searchTimeout: ReturnType<typeof setTimeout> | null = null

	// Update selectedOption when initialCharacter changes or value is cleared
	$effect(() => {
		if (!value) {
			selectedOption = null
		} else if (initialCharacter && !selectedOption) {
			selectedOption = initializeFromCharacter()
		}
	})

	// Combine search results with the selected option so Svelecte can always find it
	const options = $derived.by(() => {
		const selected = selectedOption
		if (selected && !searchResults.find((o) => o.granblueId === selected.granblueId)) {
			return [selected, ...searchResults]
		}
		return searchResults
	})

	const typeaheadClasses = $derived(
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
				locale: 'en'
			})

			searchResults = response.results.map((result: SearchResult) => ({
				id: result.id,
				label: result.name?.en || result.name?.ja || result.granblueId,
				granblueId: result.granblueId,
				element: result.element
			}))
		} catch (error) {
			console.error('Character search error:', error)
			searchResults = []
		} finally {
			isLoading = false
		}
	}

	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement | null
		const query = target?.value ?? ''

		// Debounce the search
		if (searchTimeout) {
			clearTimeout(searchTimeout)
		}

		searchTimeout = setTimeout(() => {
			searchCharacters(query)
		}, 300)
	}

	function handleChange(selected: CharacterOption | null) {
		const newValue = selected?.granblueId || null
		value = newValue
		selectedOption = selected
		onValueChange?.(newValue)
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class={typeaheadClasses} oninput={handleInput}>
	<Svelecte
		{options}
		value={value}
		labelField="label"
		valueField="granblueId"
		searchable={true}
		{placeholder}
		{disabled}
		{clearable}
		onChange={handleChange}
	>
		{#snippet toggleIcon(dropdownShow)}
			<Icon name="chevron-down-small" size={14} class="chevron" />
		{/snippet}
	</Svelecte>
	{#if isLoading}
		<span class="loading-indicator">...</span>
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

		// Svelecte CSS variable overrides
		--sv-bg: var(--input-bg);
		--sv-border-color: transparent;
		--sv-border: 1px solid var(--sv-border-color);
		--sv-active-border: 1px solid #{$blue};
		--sv-active-outline: none;
		--sv-border-radius: #{$input-corner};
		--sv-min-height: #{$unit-4x};
		--sv-placeholder-color: var(--text-tertiary);
		--sv-color: var(--text-primary);

		--sv-dropdown-bg: var(--dialog-bg);
		--sv-dropdown-border-radius: #{$card-corner};
		--sv-dropdown-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
		--sv-dropdown-offset: #{$unit-half};

		--sv-item-color: var(--text-primary);
		--sv-item-active-bg: var(--option-bg-hover);
		--sv-item-selected-bg: var(--option-bg-hover);

		--sv-icon-color: var(--text-tertiary);
		--sv-icon-hover-color: var(--text-primary);

		&.disabled {
			opacity: 0.5;
			pointer-events: none;
		}

		// Target Svelecte control for hover states
		:global(.sv-control) {
			padding: calc($unit-half + 1px) $unit calc($unit-half + 1px) $unit-half;
			@include smooth-transition($duration-quick, background-color, border-color);
		}

		&:hover:not(.disabled) :global(.sv-control) {
			background-color: var(--input-bg-hover);
		}

		// Contained variant
		&.contained {
			--sv-bg: var(--select-contained-bg);

			&:hover:not(.disabled) :global(.sv-control) {
				background-color: var(--select-contained-bg-hover);
			}
		}

		// Style the dropdown
		:global(.sv_dropdown) {
			border: 1px solid rgba(0, 0, 0, 0.1);
			max-height: 40vh;
			z-index: 102;
		}

		// Style dropdown items
		:global(.sv-item) {
			border-radius: $item-corner-small;
			padding: $unit $unit-2x;
			gap: $unit;
			@include smooth-transition($duration-quick, background-color);
		}

		// Style the input text
		:global(.sv-input--text) {
			font-family: var(--font-family);
		}

		// Style the indicator buttons
		:global(.sv-btn-indicator) {
			color: var(--text-tertiary);
			@include smooth-transition($duration-quick, color);

			&:hover {
				color: var(--text-primary);
			}
		}

		// Style our custom chevron icon
		:global(.chevron) {
			flex-shrink: 0;
			color: var(--text-tertiary);
		}

		// Hide the separator bar between buttons
		:global(.sv-btn-separator) {
			display: none;
		}
	}

	// Size variants
	.character-typeahead.small {
		--sv-min-height: #{$unit-3x};
		--sv-font-size: #{$font-small};
	}

	.character-typeahead.medium {
		--sv-min-height: #{$unit-4x};
		--sv-font-size: #{$font-regular};
	}

	.character-typeahead.large {
		--sv-min-height: calc(#{$unit} * 6);
		--sv-font-size: #{$font-large};
	}

	.loading-indicator {
		position: absolute;
		right: $unit-3x;
		top: 50%;
		transform: translateY(-50%);
		color: var(--text-tertiary);
		font-size: $font-small;
		pointer-events: none;
	}
</style>
