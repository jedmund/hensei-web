<!-- CharacterTypeahead Component - Async character search with Svelecte -->
<svelte:options runes={true} />

<script lang="ts">
	import Svelecte from 'svelecte'
	import { searchAdapter, type SearchResult } from '$lib/api/adapters/search.adapter'

	interface CharacterOption {
		id: string
		label: string
		granblueId: string
		element?: number
	}

	interface Props {
		/** Selected character ID */
		value?: string | null
		/** Callback when value changes */
		onValueChange?: (characterId: string | null) => void
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
	}

	let {
		value = $bindable(null),
		onValueChange,
		placeholder = 'Search characters...',
		disabled = false,
		size = 'medium',
		clearable = true,
		minQuery = 2
	}: Props = $props()

	let options = $state<CharacterOption[]>([])
	let isLoading = $state(false)
	let searchTimeout: ReturnType<typeof setTimeout> | null = null

	const typeaheadClasses = $derived(
		['character-typeahead', size, disabled && 'disabled'].filter(Boolean).join(' ')
	)

	async function searchCharacters(query: string) {
		if (query.length < minQuery) {
			options = []
			return
		}

		isLoading = true
		try {
			const response = await searchAdapter.searchCharacters({
				query,
				per: 20,
				locale: 'en'
			})

			options = response.results.map((result: SearchResult) => ({
				id: result.id,
				label: result.name?.en || result.name?.ja || result.granblueId,
				granblueId: result.granblueId,
				element: result.element
			}))
		} catch (error) {
			console.error('Character search error:', error)
			options = []
		} finally {
			isLoading = false
		}
	}

	function handleInput(event: CustomEvent) {
		const query = (event.detail as { inputValue?: string })?.inputValue ?? ''

		// Debounce the search
		if (searchTimeout) {
			clearTimeout(searchTimeout)
		}

		searchTimeout = setTimeout(() => {
			searchCharacters(query)
		}, 300)
	}

	function handleChange(event: CustomEvent) {
		// Svelecte emits the selected option directly in event.detail
		const selected = event.detail as CharacterOption | null
		const newValue = selected?.id || null
		value = newValue
		onValueChange?.(newValue)
	}

	// Compute current value for Svelecte display
	const displayValue = $derived.by(() => {
		if (!value) return null
		const found = options.find((o) => o.id === value)
		if (found) return found
		// If we have a value but it's not in options, show placeholder
		return { id: value, label: value, granblueId: '' } as CharacterOption
	})
</script>

<div class={typeaheadClasses}>
	<Svelecte
		{options}
		value={displayValue}
		labelField="label"
		valueField="id"
		searchable={true}
		{placeholder}
		{disabled}
		{clearable}
		on:input={handleInput}
		on:change={handleChange}
		keepSelectionInList={false}
	/>
	{#if isLoading}
		<span class="loading-indicator">...</span>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/colors' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;

	.character-typeahead {
		position: relative;
		width: 100%;

		// Svelecte overrides
		--sv-bg: var(--input-bg);
		--sv-border-color: transparent;
		--sv-border: 2px solid var(--sv-border-color);
		--sv-active-border: 2px solid #{$blue};
		--sv-active-outline: none;
		--sv-border-radius: #{$input-corner};
		--sv-min-height: calc(#{$unit} * 5.5);
		--sv-placeholder-color: var(--text-tertiary);
		--sv-color: var(--text-primary);

		--sv-dropdown-bg: var(--dialog-bg);
		--sv-dropdown-border-radius: #{$card-corner};
		--sv-dropdown-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
		--sv-dropdown-offset: #{$unit-half};

		--sv-item-color: var(--text-primary);
		--sv-item-active-bg: var(--option-bg-hover);
		--sv-item-selected-bg: var(--option-bg-hover);

		--sv-icon-color: var(--text-secondary);
		--sv-icon-hover-color: var(--text-primary);

		&.disabled {
			opacity: 0.5;
			pointer-events: none;
		}
	}

	.character-typeahead.small {
		--sv-min-height: calc(#{$unit} * 3.5);
		--sv-font-size: #{$font-small};
	}

	.character-typeahead.medium {
		--sv-min-height: calc(#{$unit} * 5.5);
		--sv-font-size: #{$font-regular};
	}

	.character-typeahead.large {
		--sv-min-height: calc(#{$unit} * 6.5);
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
