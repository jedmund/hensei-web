
<script lang="ts" generics="T extends string | number">
	import { Select as SelectPrimitive } from 'bits-ui'
	import Icon from '../Icon.svelte'

	interface Option {
		value: T
		label: string
		disabled?: boolean
		color?: string
		image?: string
	}

	interface Props {
		options: Option[]
		value?: T[]
		onValueChange?: (value: T[]) => void
		placeholder?: string
		/** Override the trigger display text (bypasses default "N selected" logic) */
		displayText?: string
		/** Minimum number of items that must stay selected (default: 0) */
		minSelected?: number
		disabled?: boolean
		size?: 'small' | 'medium' | 'large'
		contained?: boolean
		fullWidth?: boolean
		class?: string
	}

	let {
		options = [],
		value = $bindable([]),
		onValueChange,
		placeholder = 'Select...',
		displayText,
		minSelected = 0,
		disabled = false,
		size = 'small',
		contained = false,
		fullWidth = false,
		class: className = ''
	}: Props = $props()

	// Convert options to string values for Bits UI, disabling the last selected item
	const stringOptions = $derived(
		options.map((opt) => ({
			...opt,
			value: String(opt.value),
			disabled:
				opt.disabled ||
				(minSelected > 0 &&
					value.length <= minSelected &&
					value.includes(opt.value))
		}))
	)

	// Convert value array to string array for Bits UI
	const stringValue = $derived(value.map((v) => String(v)))

	// Get first selected option for display (image/color)
	const firstSelectedOption = $derived(
		value.length > 0 ? options.find((opt) => opt.value === value[0]) : undefined
	)

	// Get selected labels for display
	const selectedLabels = $derived.by(() => {
		if (value.length === 0) return null
		if (value.length === 1) {
			return options.find((opt) => opt.value === value[0])?.label
		}
		return `${value.length} selected`
	})

	const selectClasses = $derived(
		[
			'multi-select',
			size,
			contained && 'contained',
			fullWidth && 'full',
			disabled && 'disabled',
			value.length > 0 && 'has-value',
			className
		]
			.filter(Boolean)
			.join(' ')
	)

	function handleValueChange(newValue: string[]) {
		// Convert strings back to original type
		const typedValue = newValue.map((v) =>
			typeof options[0]?.value === 'number' ? Number(v) : v
		) as T[]
		value = typedValue
		onValueChange?.(typedValue)
	}
</script>

<SelectPrimitive.Root
	type="multiple"
	value={stringValue}
	onValueChange={handleValueChange}
	{disabled}
	items={stringOptions}
>
	<SelectPrimitive.Trigger class={selectClasses} data-placeholder={value.length === 0}>
		{#if firstSelectedOption?.image}
			<img src={firstSelectedOption.image} alt="" class="trigger-image" />
		{:else if firstSelectedOption?.color}
			<span class="trigger-color-dot" style="background-color: {firstSelectedOption.color}"></span>
		{/if}
		<span class="text">{displayText ?? selectedLabels ?? placeholder}</span>
		<Icon name="chevron-down-small" size={14} class="chevron" />
	</SelectPrimitive.Trigger>

	<SelectPrimitive.Content class="multi-content">
		<SelectPrimitive.Viewport>
			{#each stringOptions as option}
				<SelectPrimitive.Item
					value={option.value}
					label={option.label}
					disabled={option.disabled}
					class="multi-item"
					style={option.color ? `--option-color: ${option.color}` : ''}
				>
					{#snippet children({ selected })}
						{#if option.image}
							<img src={option.image} alt="" class="item-image" />
						{/if}
						<span class="label" class:has-color={!!option.color && !option.image} class:selected
							>{option.label}</span
						>
						<span class="indicator">
							<Icon name="check" size={12} class="check-icon {selected ? 'visible' : ''}" />
						</span>
					{/snippet}
				</SelectPrimitive.Item>
			{/each}
		</SelectPrimitive.Viewport>
	</SelectPrimitive.Content>
</SelectPrimitive.Root>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/colors' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/mixins' as *;
	@use '$src/themes/effects' as *;

	// Trigger styling - base styles
	:global([data-select-trigger].multi-select) {
		all: unset;
		box-sizing: border-box;
		-webkit-font-smoothing: antialiased;
		align-items: center;
		background-color: var(--input-bg);
		border-radius: $input-corner;
		border: 1px solid transparent;
		color: var(--text-primary);
		cursor: pointer;
		display: inline-flex;
		font-family: var(--font-family);
		gap: $unit-half;
		@include smooth-transition($duration-quick, background-color, border-color, box-shadow);

		&:hover:not(.disabled) {
			background-color: var(--input-bg-hover);
		}

		&:focus-visible {
			@include focus-ring($blue);
		}

		&.disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}

		&[data-placeholder='true'] .text {
			color: var(--text-secondary);
		}

		&.has-value {
			border-color: var(--accent-color, $blue);
			background-color: rgba($blue, 0.08);
		}

		.text {
			flex: 1;
			text-align: left;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			color: var(--text-secondary);
		}

		.trigger-image {
			width: $unit-3x;
			height: $unit-3x;
			flex-shrink: 0;
			object-fit: contain;
		}

		.trigger-color-dot {
			width: 10px;
			height: 10px;
			border-radius: 50%;
			flex-shrink: 0;
		}

		:global(.chevron) {
			flex-shrink: 0;
			color: var(--text-tertiary);
		}
	}

	// Size: small
	:global([data-select-trigger].multi-select.small) {
		padding: $unit-half $unit;
		font-size: $font-small;
		min-height: $unit-3x;
	}

	// Size: medium (default for standalone use)
	:global([data-select-trigger].multi-select.medium) {
		padding: $unit calc($unit * 1.5);
		font-size: $font-regular;
		min-height: $unit-4x;
	}

	// Variant: contained
	:global([data-select-trigger].multi-select.contained) {
		background-color: var(--select-contained-bg);

		&:hover:not(.disabled) {
			background-color: var(--select-contained-bg-hover);
		}
	}

	// Variant: full width
	:global([data-select-trigger].multi-select.full) {
		width: 100%;
	}

	// Dropdown content
	:global([data-select-content].multi-content) {
		background: var(--dialog-bg);
		border-radius: $card-corner;
		border: 1px solid rgba(0, 0, 0, 0.1);
		box-shadow: var(--shadow-lg);
		padding: $unit-half;
		min-width: var(--bits-select-anchor-width);
		max-height: 280px;
		overflow: auto;
		z-index: $z-popover;
		animation: fadeIn $duration-opacity-fade ease-out;

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
	}

	// Dropdown items
	:global([data-select-item].multi-item) {
		align-items: center;
		border-radius: $item-corner-small;
		color: var(--text-primary);
		cursor: pointer;
		display: flex;
		gap: $unit;
		padding: $unit calc($unit * 1.5);
		user-select: none;
		font-size: $font-small;
		font-weight: $normal;
		@include smooth-transition($duration-quick, background-color);

		&:hover {
			background-color: var(--select-contained-bg-hover);
		}

		&[data-disabled] {
			color: var(--text-tertiary);
			cursor: not-allowed;
			opacity: 0.5;
		}

		&:first-child {
			border-top-left-radius: $item-corner;
			border-top-right-radius: $item-corner;
		}

		&:last-child {
			border-bottom-left-radius: $item-corner;
			border-bottom-right-radius: $item-corner;
		}

		.item-image {
			width: $unit-3x;
			height: $unit-3x;
			flex-shrink: 0;
			object-fit: contain;
		}

		:global(.check-icon) {
			opacity: 0;
			transition: opacity $duration-quick ease;
			color: var(--text-tertiary);
		}

		:global(.check-icon.visible) {
			opacity: 1;
		}

		.label {
			flex: 1;
			min-width: $unit-8x;

			&.selected {
				font-weight: $medium;
			}

			&.has-color {
				&::before {
					content: '';
					display: inline-block;
					width: 10px;
					height: 10px;
					border-radius: 50%;
					background: var(--option-color);
					margin-right: $unit;
				}
			}
		}

		:global(.indicator) {
			margin-left: auto;
			color: var(--accent-color);
		}
	}

	// Highlighted state (separate global selector for typeahead)
	:global([data-select-item].multi-item[data-highlighted]) {
		background-color: var(--option-bg-hover);
	}
</style>
