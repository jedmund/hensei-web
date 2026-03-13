
<script lang="ts">
	import { ToggleGroup } from 'bits-ui'
	import Tooltip from '../Tooltip.svelte'
	import { getProficiencyLabel, getProficiencyImage } from '$lib/utils/proficiency'

	// Proficiency display order: Sabre, Dagger, Spear, Axe, Staff, Gun, Melee, Bow, Harp, Katana
	// Using values from PROFICIENCY_LABELS: 1=Sabre, 2=Dagger, 3=Axe, 4=Spear, 5=Bow, 6=Staff, 7=Melee, 8=Harp, 9=Gun, 10=Katana
	const PROFICIENCY_DISPLAY_ORDER = [1, 2, 4, 3, 6, 9, 7, 5, 8, 10]

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

	// Check if any proficiencies are selected
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

	// Get label for proficiency
	function getLabel(proficiency: number): string {
		return getProficiencyLabel(proficiency)
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
					class="proficiency-group"
					{disabled}
				>
					{#each PROFICIENCY_DISPLAY_ORDER as proficiency}
						<Tooltip content={getLabel(proficiency)}>
							{#snippet children()}
								<ToggleGroup.Item
									value={String(proficiency)}
									class="proficiency-item"
									{disabled}
								>
									<img
										src={getProficiencyImage(proficiency)}
										alt={getLabel(proficiency)}
										class="proficiency-image"
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
					class="proficiency-group"
					{disabled}
				>
					{#each PROFICIENCY_DISPLAY_ORDER as proficiency}
						<Tooltip content={getLabel(proficiency)}>
							{#snippet children()}
								<ToggleGroup.Item
									value={String(proficiency)}
									class="proficiency-item"
									{disabled}
								>
									<img
										src={getProficiencyImage(proficiency)}
										alt={getLabel(proficiency)}
										class="proficiency-image"
									/>
								</ToggleGroup.Item>
							{/snippet}
						</Tooltip>
					{/each}
				</ToggleGroup.Root>
			{/if}
		</div>
		{#if hasSelection}
			<button type="button" class="clearButton" onclick={handleClear}> Clear </button>
		{/if}
	</div>
{:else}
	<div class={containerClasses}>
		{#if multiple}
			<ToggleGroup.Root
				type="multiple"
				value={stringValue as string[]}
				onValueChange={handleMultipleChange}
				class="proficiency-group"
				{disabled}
			>
				{#each PROFICIENCY_DISPLAY_ORDER as proficiency}
					<Tooltip content={getLabel(proficiency)}>
						{#snippet children()}
							<ToggleGroup.Item
								value={String(proficiency)}
								class="proficiency-item"
								{disabled}
							>
								<img src={getProficiencyImage(proficiency)} alt={getLabel(proficiency)} class="proficiency-image" />
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
				class="proficiency-group"
				{disabled}
			>
				{#each PROFICIENCY_DISPLAY_ORDER as proficiency}
					<Tooltip content={getLabel(proficiency)}>
						{#snippet children()}
							<ToggleGroup.Item
								value={String(proficiency)}
								class="proficiency-item"
								{disabled}
							>
								<img src={getProficiencyImage(proficiency)} alt={getLabel(proficiency)} class="proficiency-image" />
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
		display: flex;
		width: 100%;
		border-radius: $full-corner;
		padding: $unit-half;

		&.contained {
			background-color: var(--segmented-control-background-bg);
		}
	}

	:global(.proficiency-group) {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
	}

	:global(.proficiency-item) {
		all: unset;
		cursor: pointer;
		border-radius: $full-corner;
		padding: $unit-half;
		@include smooth-transition($duration-quick, background-color, opacity);
	}

	:global(.proficiency-item:focus-visible) {
		@include focus-ring($blue);
	}

	:global(.proficiency-item:disabled) {
		opacity: 0.5;
		cursor: not-allowed;
	}

	// Simple hover and selected states with gray background
	:global(.proficiency-item:hover:not(:disabled)) {
		background-color: var(--picker-item-bg-hover);
	}

	:global(.proficiency-item[data-state='on']) {
		background-color: var(--picker-item-bg-selected);
	}

	:global(.proficiency-image) {
		display: block;
	}

	// Size variants
	.small {
		:global(.proficiency-item) {
			padding: $unit-half;
		}

		:global(.proficiency-image) {
			width: calc($unit * 3.25);
			height: calc($unit * 3.25);
		}
	}

	.regular {
		:global(.proficiency-item) {
			padding: $unit-half;
		}

		:global(.proficiency-image) {
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
