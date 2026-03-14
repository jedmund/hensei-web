
<script lang="ts">
	import { ToggleGroup } from 'bits-ui'
	import Tooltip from '../Tooltip.svelte'
	import { RARITY_LABELS, getRarityImage } from '$lib/utils/rarity'
	import * as m from '$lib/paraglide/messages'

	// Rarity display order: R(1) → SR(2) → SSR(3)
	const RARITY_DISPLAY_ORDER = [1, 2, 3]

	interface Props {
		value?: number | number[]
		onValueChange?: (value: number | number[]) => void
		multiple?: boolean
		contained?: boolean
		disabled?: boolean
		size?: 'small' | 'regular'
		showClear?: boolean
		class?: string
	}

	let {
		value = $bindable(),
		onValueChange,
		multiple = false,
		contained = false,
		disabled = false,
		size = 'small',
		showClear = false,
		class: className = ''
	}: Props = $props()

	// Check if any rarities are selected
	const hasSelection = $derived.by(() => {
		if (multiple) {
			const arr = Array.isArray(value) ? value : value !== undefined ? [value] : []
			return arr.length > 0
		}
		return value !== undefined
	})

	function handleClear() {
		if (multiple) {
			value = []
			onValueChange?.([])
		} else {
			value = undefined
			onValueChange?.(undefined as any)
		}
	}

	// Get label for rarity
	function getLabel(rarity: number): string {
		return RARITY_LABELS[rarity] ?? 'Unknown'
	}

	// Convert value to string format for ToggleGroup
	const stringValue = $derived.by(() => {
		if (multiple) {
			const arr = Array.isArray(value) ? value : value !== undefined ? [value] : []
			return arr.map(String)
		} else {
			return value !== undefined ? String(value) : undefined
		}
	})

	// Handle value changes from ToggleGroup
	function handleSingleChange(newValue: string | undefined) {
		if (newValue !== undefined) {
			const numValue = Number(newValue)
			value = numValue
			onValueChange?.(numValue)
		}
	}

	function handleMultipleChange(newValue: string[]) {
		const numValues = newValue.map(Number)
		value = numValues
		onValueChange?.(numValues)
	}

	const containerClasses = $derived(
		['container', contained && 'contained', size === 'regular' ? 'regular' : 'small', className]
			.filter(Boolean)
			.join(' ')
	)
</script>

{#if showClear}
	<div class="wrapper">
		<div class={containerClasses}>
			{#if multiple}
				<ToggleGroup.Root
					type="multiple"
					value={stringValue as string[]}
					onValueChange={handleMultipleChange}
					class="rarity-group"
					{disabled}
				>
					{#each RARITY_DISPLAY_ORDER as rarity}
						<Tooltip content={getLabel(rarity)}>
							{#snippet children()}
								<ToggleGroup.Item
									value={String(rarity)}
									class="rarity-item"
									{disabled}
								>
									<img
										src={getRarityImage(rarity)}
										alt={getLabel(rarity)}
										class="rarity-image"
									/>
								</ToggleGroup.Item>
							{/snippet}
						</Tooltip>
					{/each}
				</ToggleGroup.Root>
			{:else}
				<ToggleGroup.Root
					type="single"
					value={stringValue as string | undefined}
					onValueChange={handleSingleChange}
					class="rarity-group"
					{disabled}
				>
					{#each RARITY_DISPLAY_ORDER as rarity}
						<Tooltip content={getLabel(rarity)}>
							{#snippet children()}
								<ToggleGroup.Item
									value={String(rarity)}
									class="rarity-item"
									{disabled}
								>
									<img
										src={getRarityImage(rarity)}
										alt={getLabel(rarity)}
										class="rarity-image"
									/>
								</ToggleGroup.Item>
							{/snippet}
						</Tooltip>
					{/each}
				</ToggleGroup.Root>
			{/if}
		</div>
		{#if hasSelection}
			<button type="button" class="clearButton" onclick={handleClear}> {m.button_clear()} </button>
		{/if}
	</div>
{:else}
	<div class={containerClasses}>
		{#if multiple}
			<ToggleGroup.Root
				type="multiple"
				value={stringValue as string[]}
				onValueChange={handleMultipleChange}
				class="rarity-group"
				{disabled}
			>
				{#each RARITY_DISPLAY_ORDER as rarity}
					<Tooltip content={getLabel(rarity)}>
						{#snippet children()}
							<ToggleGroup.Item
								value={String(rarity)}
								class="rarity-item"
								{disabled}
							>
								<img src={getRarityImage(rarity)} alt={getLabel(rarity)} class="rarity-image" />
							</ToggleGroup.Item>
						{/snippet}
					</Tooltip>
				{/each}
			</ToggleGroup.Root>
		{:else}
			<ToggleGroup.Root
				type="single"
				value={stringValue as string | undefined}
				onValueChange={handleSingleChange}
				class="rarity-group"
				{disabled}
			>
				{#each RARITY_DISPLAY_ORDER as rarity}
					<Tooltip content={getLabel(rarity)}>
						{#snippet children()}
							<ToggleGroup.Item
								value={String(rarity)}
								class="rarity-item"
								{disabled}
							>
								<img src={getRarityImage(rarity)} alt={getLabel(rarity)} class="rarity-image" />
							</ToggleGroup.Item>
						{/snippet}
					</Tooltip>
				{/each}
			</ToggleGroup.Root>
		{/if}
	</div>
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/effects' as *;
	@use '$src/themes/colors' as *;
	@use '$src/themes/typography' as *;

	.wrapper {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		gap: $unit;
	}

	.container {
		display: inline-flex;
		border-radius: $full-corner;
		padding: $unit-half;

		&.contained {
			background-color: var(--segmented-control-background-bg);
		}
	}

	:global(.rarity-group) {
		display: flex;
		gap: $unit-quarter;
		align-items: center;
	}

	:global(.rarity-item) {
		all: unset;
		cursor: pointer;
		border-radius: $full-corner;
		padding: $unit-half;
		@include smooth-transition($duration-quick, background-color, opacity);
	}

	:global(.rarity-item:focus-visible) {
		@include focus-ring($blue);
	}

	:global(.rarity-item:disabled) {
		opacity: 0.5;
		cursor: not-allowed;
	}

	// Simple hover and selected states with gray background
	:global(.rarity-item:hover:not(:disabled)) {
		background-color: var(--picker-item-bg-hover);
	}

	:global(.rarity-item[data-state='on']) {
		background-color: var(--picker-item-bg-selected);
	}

	:global(.rarity-image) {
		display: block;
	}

	// Size variants
	.small {
		:global(.rarity-item) {
			padding: $unit-half;
		}

		:global(.rarity-image) {
			width: calc($unit * 3.25);
			height: calc($unit * 3.25);
		}
	}

	.regular {
		:global(.rarity-item) {
			padding: $unit-half;
		}

		:global(.rarity-image) {
			width: $unit-4x;
			height: $unit-4x;
		}
	}

	.clearButton {
		all: unset;
		cursor: pointer;
		font-size: $font-small;
		color: var(--text-secondary);
		padding: $unit-half $unit;
		border-radius: $input-corner;
		@include smooth-transition($duration-quick, background-color, color);

		&:hover {
			background-color: var(--option-bg-hover);
			color: var(--text-primary);
		}

		&:focus-visible {
			@include focus-ring($blue);
		}
	}
</style>
