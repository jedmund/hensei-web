<!-- CharacterTypeahead Component - Async character search with Svelecte -->
<svelte:options runes={true} />

<script lang="ts">
	import Svelecte from 'svelecte'
	import Icon from '../Icon.svelte'
	import { searchAdapter, type SearchResult } from '$lib/api/adapters/search.adapter'
	import { getCharacterImage } from '$lib/utils/images'

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

	let searchResults = $state<CharacterOption[]>([])
	// Only used when user selects something NEW (different from initialCharacter)
	let userSelectedOption = $state<CharacterOption | null>(null)
	let isLoading = $state(false)
	let searchTimeout: ReturnType<typeof setTimeout> | null = null

	// Clear userSelectedOption when value is cleared
	$effect(() => {
		if (!value) {
			userSelectedOption = null
		}
	})

	// Derive options: include initialCharacter or userSelectedOption so Svelecte can find the value
	const options = $derived.by(() => {
		const results = [...searchResults]

		// If user selected something new, prioritize that
		const userSelected = userSelectedOption
		if (userSelected && !results.find((o) => o.granblueId === userSelected.granblueId)) {
			return [userSelected, ...results]
		}

		// Otherwise, include initialCharacter if we have a value matching it
		if (value && initialCharacter && initialCharacter.granblueId === value) {
			const initOption: CharacterOption = {
				id: initialCharacter.id,
				label: initialCharacter.name,
				granblueId: initialCharacter.granblueId
			}
			if (!results.find((o) => o.granblueId === initOption.granblueId)) {
				return [initOption, ...results]
			}
		}

		return results
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
		// Only track as userSelectedOption if it's different from initialCharacter
		if (selected && initialCharacter && selected.granblueId === initialCharacter.granblueId) {
			userSelectedOption = null // Use initialCharacter instead
		} else {
			userSelectedOption = selected
		}
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
		{#snippet option(opt)}
			{@const char = opt as CharacterOption}
			<div class="option-item">
				<img
					src={getCharacterImage(char.granblueId, 'square', '01')}
					alt=""
					class="option-image"
				/>
				<span class="option-label">{char.label}</span>
			</div>
		{/snippet}
		{#snippet selection(sel)}
			{@const char = (sel as CharacterOption[])[0]}
			{#if char}
				<div class="selection-item">
					<img
						src={getCharacterImage(char.granblueId, 'square', '01')}
						alt=""
						class="selection-image"
					/>
					<span class="selection-label">{char.label}</span>
				</div>
			{/if}
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
			z-index: $z-modal + 2;
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

		// Custom option item styling
		.option-item {
			display: flex;
			align-items: center;
			gap: $unit;
		}

		.option-image {
			width: 24px;
			height: 24px;
			border-radius: $item-corner-small;
			flex-shrink: 0;
		}

		.option-label {
			flex: 1;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		// Custom selection item styling (shown in input when value selected)
		.selection-item {
			display: flex;
			align-items: center;
			gap: $unit-half;
		}

		.selection-image {
			width: 20px;
			height: 20px;
			border-radius: $item-corner-small;
			flex-shrink: 0;
		}

		.selection-label {
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
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
