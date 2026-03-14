
<script lang="ts">
	import { ToggleGroup } from 'bits-ui'
	import Tooltip from '../Tooltip.svelte'
	import { getElementLabel, getElementImage } from '$lib/utils/element'
	import * as m from '$lib/paraglide/messages'

	// Element display order: Fire(2) → Water(3) → Earth(4) → Wind(1) → Light(6) → Dark(5)
	const ELEMENT_DISPLAY_ORDER = [2, 3, 4, 1, 6, 5]

	interface Props {
		value?: number | number[]
		onValueChange?: (value: number | number[]) => void
		multiple?: boolean
		includeAny?: boolean
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
		includeAny = false,
		contained = false,
		disabled = false,
		size = 'small',
		showClear = false,
		class: className = ''
	}: Props = $props()


	// Check if any elements are selected
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

	// Build element list based on includeAny prop
	const elements = $derived(includeAny ? [0, ...ELEMENT_DISPLAY_ORDER] : ELEMENT_DISPLAY_ORDER)

	// Get label for element (use "Any" for element 0 instead of "Null")
	function getLabel(element: number): string {
		if (element === 0) return m.element_any()
		return getElementLabel(element)
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
					class="element-group"
					{disabled}
				>
					{#each elements as element}
						<Tooltip content={getLabel(element)}>
							{#snippet children()}
								<ToggleGroup.Item
									value={String(element)}
									class="element-item"
									{disabled}
								>
									<img
										src={getElementImage(element)}
										alt={getLabel(element)}
										class="element-image"
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
					class="element-group"
					{disabled}
				>
					{#each elements as element}
						<Tooltip content={getLabel(element)}>
							{#snippet children()}
								<ToggleGroup.Item
									value={String(element)}
									class="element-item"
									{disabled}
								>
									<img
										src={getElementImage(element)}
										alt={getLabel(element)}
										class="element-image"
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
				class="element-group"
				{disabled}
			>
				{#each elements as element}
					<Tooltip content={getLabel(element)}>
						{#snippet children()}
							<ToggleGroup.Item
								value={String(element)}
								class="element-item"
								{disabled}
							>
								<img src={getElementImage(element)} alt={getLabel(element)} class="element-image" />
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
				class="element-group"
				{disabled}
			>
				{#each elements as element}
					<Tooltip content={getLabel(element)}>
						{#snippet children()}
							<ToggleGroup.Item
								value={String(element)}
								class="element-item"
								{disabled}
							>
								<img src={getElementImage(element)} alt={getLabel(element)} class="element-image" />
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

	:global(.element-group) {
		display: flex;
		gap: $unit-quarter;
		align-items: center;
	}

	:global(.element-item) {
		all: unset;
		cursor: pointer;
		border-radius: $full-corner;
		padding: $unit-half;
		@include smooth-transition($duration-quick, background-color, opacity);
	}

	:global(.element-item:focus-visible) {
		@include focus-ring($blue);
	}

	:global(.element-item:disabled) {
		opacity: 0.5;
		cursor: not-allowed;
	}

	// Element-specific hover and selected states
	:global(.element-item[data-value='0']:hover:not(:disabled)) {
		background-color: var(--null-nav-hover-bg);
	}
	:global(.element-item[data-value='0'][data-state='on']) {
		background-color: var(--null-nav-selected-bg);
	}

	:global(.element-item[data-value='1']:hover:not(:disabled)) {
		background-color: var(--wind-nav-hover-bg);
	}
	:global(.element-item[data-value='1'][data-state='on']) {
		background-color: var(--wind-nav-selected-bg);
	}

	:global(.element-item[data-value='2']:hover:not(:disabled)) {
		background-color: var(--fire-nav-hover-bg);
	}
	:global(.element-item[data-value='2'][data-state='on']) {
		background-color: var(--fire-nav-selected-bg);
	}

	:global(.element-item[data-value='3']:hover:not(:disabled)) {
		background-color: var(--water-nav-hover-bg);
	}
	:global(.element-item[data-value='3'][data-state='on']) {
		background-color: var(--water-nav-selected-bg);
	}

	:global(.element-item[data-value='4']:hover:not(:disabled)) {
		background-color: var(--earth-nav-hover-bg);
	}
	:global(.element-item[data-value='4'][data-state='on']) {
		background-color: var(--earth-nav-selected-bg);
	}

	:global(.element-item[data-value='5']:hover:not(:disabled)) {
		background-color: var(--dark-nav-hover-bg);
	}
	:global(.element-item[data-value='5'][data-state='on']) {
		background-color: var(--dark-nav-selected-bg);
	}

	:global(.element-item[data-value='6']:hover:not(:disabled)) {
		background-color: var(--light-nav-hover-bg);
	}
	:global(.element-item[data-value='6'][data-state='on']) {
		background-color: var(--light-nav-selected-bg);
	}

	:global(.element-image) {
		display: block;
	}

	// Size variants
	.small {
		:global(.element-item) {
			padding: $unit-half;
		}

		:global(.element-image) {
			width: calc($unit * 3.25);
			height: calc($unit * 3.25);
		}
	}

	.regular {
		:global(.element-item) {
			padding: $unit-half;
		}

		:global(.element-image) {
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
