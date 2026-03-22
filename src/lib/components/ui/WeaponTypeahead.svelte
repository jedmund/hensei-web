<!-- WeaponTypeahead Component - Async weapon search with bits-ui Combobox -->

<script lang="ts">
	import { Combobox } from 'bits-ui'
	import Icon from '../Icon.svelte'
	import { searchAdapter, type SearchResult } from '$lib/api/adapters/search.adapter'
	import { getWeaponGridImage, getWeaponFallbackImage, handleImageFallback } from '$lib/utils/images'
	import { localizedName, appLocale } from '$lib/utils/locale'

	interface WeaponOption {
		id: string
		label: string
		granblueId: string
		element?: number
	}

	interface Props {
		/** Selected weapon granblue ID (e.g. "1040001000") */
		value?: string | null
		/** Initial weapon data for display (when loading existing value) */
		initialWeapon?: { id: string; name: string; granblueId: string } | null
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
		initialWeapon = null,
		onValueChange,
		placeholder = 'Search weapons...',
		disabled = false,
		size = 'medium',
		clearable = true,
		minQuery = 2,
		contained = false
	}: Props = $props()

	let searchResults = $state<WeaponOption[]>([])
	let isLoading = $state(false)
	let searchTimeout: ReturnType<typeof setTimeout> | null = null
	let comboboxOpen = $state(false)
	let inputValue = $state('')

	// The selected granblueId used as the combobox value
	let selectedGranblueId = $state<string>(value ?? '')

	// Sync external value changes into combobox
	$effect(() => {
		selectedGranblueId = value ?? ''
	})

	// Set initial input display text from initialWeapon
	$effect(() => {
		if (initialWeapon && value && initialWeapon.granblueId === value && !inputValue) {
			inputValue = initialWeapon.name
		}
	})

	// Track the currently displayed weapon for the selection display
	let displayedWeapon = $state<WeaponOption | null>(null)

	$effect(() => {
		if (value && initialWeapon && initialWeapon.granblueId === value && !displayedWeapon) {
			displayedWeapon = {
				id: initialWeapon.id,
				label: initialWeapon.name,
				granblueId: initialWeapon.granblueId
			}
		}
	})

	const comboboxItems = $derived(
		searchResults.map((w) => ({ value: w.granblueId, label: w.label }))
	)

	const wrapperClasses = $derived(
		['weapon-typeahead', size, contained && 'contained', disabled && 'disabled']
			.filter(Boolean)
			.join(' ')
	)

	async function searchWeapons(query: string) {
		if (query.length < minQuery) {
			searchResults = []
			return
		}

		isLoading = true
		try {
			const response = await searchAdapter.searchWeapons({
				query,
				per: 20,
				locale: appLocale()
			})

			searchResults = response.results.map((result: SearchResult) => ({
				id: result.id,
				label: localizedName(result.name) !== '—' ? localizedName(result.name) : result.granblueId,
				granblueId: result.granblueId,
				element: result.element
			}))
			if (searchResults.length > 0) {
				comboboxOpen = true
			}
		} catch (error) {
			if (import.meta.env.DEV) {
				console.error('Weapon search error:', error)
			}
			searchResults = []
		} finally {
			isLoading = false
		}
	}

	function handleInputChange(val: string) {
		inputValue = val
		if (searchTimeout) clearTimeout(searchTimeout)
		searchTimeout = setTimeout(() => searchWeapons(val), 300)

		if (!val.trim()) {
			selectedGranblueId = ''
			displayedWeapon = null
			value = null
			onValueChange?.(null)
		}
	}

	function handleValueChange(granblueId: string) {
		selectedGranblueId = granblueId
		if (granblueId) {
			const match = searchResults.find((w) => w.granblueId === granblueId)
			if (match) {
				displayedWeapon = match
				inputValue = match.label
				value = granblueId
				onValueChange?.(granblueId)
			}
		} else {
			displayedWeapon = null
			value = null
			onValueChange?.(null)
		}
		comboboxOpen = false
	}

	function handleClear() {
		selectedGranblueId = ''
		inputValue = ''
		displayedWeapon = null
		searchResults = []
		value = null
		onValueChange?.(null)
	}
</script>

<div class={wrapperClasses}>
	<Combobox.Root
		type="single"
		bind:value={selectedGranblueId}
		onValueChange={handleValueChange}
		bind:open={comboboxOpen}
		bind:inputValue
		items={comboboxItems}
		disabled={disabled}
	>
		<div class="combobox-input-wrapper">
			<Combobox.Input
				class="combobox-input"
				{placeholder}
				oninput={(e) => handleInputChange(e.currentTarget.value)}
				{disabled}
			/>
			{#if isLoading}
				<span class="input-loading">
					<Icon name="loader-2" size={14} />
				</span>
			{:else if clearable && displayedWeapon}
				<button type="button" class="clear-button" onclick={handleClear}>
					<Icon name="close" size={12} />
				</button>
			{/if}
		</div>

		<Combobox.Content class="combobox-content">
			<Combobox.Viewport>
				{#each searchResults as weapon (weapon.granblueId)}
					<Combobox.Item value={weapon.granblueId} label={weapon.label} class="combobox-item">
						{#snippet children({ selected })}
							<img
								src={getWeaponGridImage(weapon.granblueId, weapon.element)}
								alt=""
								class="item-image"
								onerror={(e) => handleImageFallback(e, weapon.element === 0 ? getWeaponFallbackImage(weapon.granblueId, 'grid') : undefined)}
							/>
							<span class="item-label">{weapon.label}</span>
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
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/colors' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/mixins' as *;
	@use '$src/themes/effects' as *;

	.weapon-typeahead {
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

	:global(.weapon-typeahead .combobox-input) {
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
	.weapon-typeahead.contained :global(.combobox-input) {
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

	.clear-button {
		position: absolute;
		right: $unit;
		top: 50%;
		transform: translateY(-50%);
		display: flex;
		align-items: center;
		justify-content: center;
		width: 20px;
		height: 20px;
		padding: 0;
		border: none;
		background: transparent;
		color: var(--text-secondary);
		cursor: pointer;
		border-radius: $unit-half;
		@include smooth-transition($duration-quick, background-color, color);

		&:hover {
			background: var(--surface-tertiary);
			color: var(--text-primary);
		}

		:global(svg) {
			fill: currentColor;
		}
	}

	// Dropdown
	:global(.weapon-typeahead .combobox-content) {
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
	:global(.weapon-typeahead .combobox-item) {
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

	.item-image {
		width: 24px;
		height: 24px;
		border-radius: $item-corner-small;
		flex-shrink: 0;
	}

	.item-label {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.item-check {
		margin-left: auto;
		color: var(--accent-color);
	}

	// Size variants
	.weapon-typeahead.small :global(.combobox-input) {
		min-height: $unit-3x;
		font-size: $font-small;
	}

	.weapon-typeahead.large :global(.combobox-input) {
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
