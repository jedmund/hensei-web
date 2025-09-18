<svelte:options runes={true} />

<script lang="ts" generics="T extends string | number">
	import { Select as SelectPrimitive } from 'bits-ui'
	import { Label } from 'bits-ui'
	import Icon from '../Icon.svelte'

	interface Option {
		value: T
		label: string
		disabled?: boolean
		image?: string
	}

	interface Props {
		options: Option[]
		value?: T
		onValueChange?: (value: T | undefined) => void
		placeholder?: string
		disabled?: boolean
		size?: 'small' | 'medium' | 'large'
		contained?: boolean
		fullWidth?: boolean
		label?: string
		error?: string
		required?: boolean
		class?: string
	}

	let {
		options = [],
		value = $bindable(),
		onValueChange,
		placeholder = 'Select an option',
		disabled = false,
		size = 'medium',
		contained = false,
		fullWidth = false,
		label,
		error,
		required = false,
		class: className = ''
	}: Props = $props()

	// Convert options to string values for Bits UI (which expects strings internally)
	const stringOptions = $derived(
		options.map((opt) => ({
			...opt,
			value: String(opt.value)
		}))
	)

	const selected = $derived(options.find((opt) => opt.value === value))
	const hasWrapper = $derived(label || error)

	const fieldsetClasses = $derived(
		['fieldset', fullWidth && 'full', className].filter(Boolean).join(' ')
	)

	const selectClasses = $derived(
		[
			'select',
			size,
			contained && 'contained',
			fullWidth && 'full',
			disabled && 'disabled'
		]
			.filter(Boolean)
			.join(' ')
	)

	function handleValueChange(newValue: string | undefined) {
		if (newValue !== undefined) {
			// Convert string back to original type
			const typedValue = (typeof options[0]?.value === 'number' ? Number(newValue) : newValue) as T
			value = typedValue
			if (onValueChange) {
				onValueChange(typedValue)
			}
		}
	}
</script>

{#if hasWrapper}
	<fieldset class={fieldsetClasses}>
		{#if label}
			<Label.Root class="label" for={crypto.randomUUID()}>
				{label}
				{#if required}
					<span class="required">*</span>
				{/if}
			</Label.Root>
		{/if}

		<SelectPrimitive.Root type="single" value={value !== undefined && value !== null ? String(value) : undefined} onValueChange={handleValueChange} {disabled} items={stringOptions}>
			<SelectPrimitive.Trigger class={selectClasses} data-placeholder={!selected}>
				{#if selected?.image}
					<img src={selected.image} alt={selected.label} class="image" />
				{/if}
				<span class="text">{selected?.label || placeholder}</span>
				<Icon name="chevron-down-small" size={14} class="chevron" />
			</SelectPrimitive.Trigger>

			<SelectPrimitive.Content class="content">
				<SelectPrimitive.Viewport>
					{#each options as option}
						<SelectPrimitive.Item value={String(option.value)} disabled={option.disabled} class="item">
							{#if option.image}
								<img src={option.image} alt={option.label} class="image" />
							{/if}
							<span class="text">{option.label}</span>
							<SelectPrimitive.ItemIndicator class="indicator">
								<Icon name="check" size={14} />
							</SelectPrimitive.ItemIndicator>
						</SelectPrimitive.Item>
					{/each}
				</SelectPrimitive.Viewport>
			</SelectPrimitive.Content>
		</SelectPrimitive.Root>

		{#if error}
			<span class="error">{error}</span>
		{/if}
	</fieldset>
{:else}
	<SelectPrimitive.Root type="single" value={value !== undefined && value !== null ? String(value) : undefined} onValueChange={handleValueChange} {disabled} items={stringOptions} class={className}>
		<SelectPrimitive.Trigger class={selectClasses} data-placeholder={!selected}>
			{#if selected?.image}
				<img src={selected.image} alt={selected.label} class="image" />
			{/if}
			<span class="text">{selected?.label || placeholder}</span>
			<Icon name="chevron-down-small" size={14} class="chevron" />
		</SelectPrimitive.Trigger>

		<SelectPrimitive.Content class="content">
			<SelectPrimitive.Viewport>
				{#each options as option}
					<SelectPrimitive.Item value={String(option.value)} disabled={option.disabled} class="item">
						{#if option.image}
							<img src={option.image} alt={option.label} class="image" />
						{/if}
						<span class="text">{option.label}</span>
						<SelectPrimitive.ItemIndicator class="indicator">
							<Icon name="check" size={14} />
						</SelectPrimitive.ItemIndicator>
					</SelectPrimitive.Item>
				{/each}
			</SelectPrimitive.Viewport>
		</SelectPrimitive.Content>
	</SelectPrimitive.Root>
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/colors' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/mixins' as *;
	@use '$src/themes/effects' as *;

	// Fieldset wrapper (matching Input component)
	.fieldset {
		display: flex;
		flex-direction: column;
		gap: $unit-half;

		&.full {
			width: 100%;
		}

		:global(.label) {
			color: var(--text-primary);
			font-size: $font-small;
			font-weight: $medium;
			margin-bottom: $unit-half;
		}

		:global(.label .required) {
			color: $error;
			margin-left: $unit-fourth;
		}

		.error {
			color: $error;
			font-size: $font-small;
			padding: $unit-half $unit-2x;
		}
	}

	// Select trigger styling (matching Input component)
	:global([data-select-trigger]) {
		all: unset;
		box-sizing: border-box;
		display: inline-flex;
		cursor: pointer;
	}

	:global([data-select-trigger].select) {
		-webkit-font-smoothing: antialiased;
		align-items: center;
		background-color: var(--input-bg);
		border-radius: $input-corner;
		border: 2px solid transparent;
		color: var(--text-primary);
		display: flex;
		font-family: var(--font-family);
		gap: $unit;
		width: 100%;
		@include smooth-transition($duration-quick, background-color, border-color);

		&:hover:not(.disabled) {
			background-color: var(--input-bg-hover);
		}

		&:focus-visible {
			@include focus-ring($blue);
		}
	}

	// Size modifiers (matching Button component)
	:global([data-select-trigger].select.small) {
		padding: $unit $unit-2x;
		font-size: $font-small;
		min-height: calc($unit * 3.5);
	}

	:global([data-select-trigger].select.medium) {
		padding: $unit ($unit * 2.5);
		font-size: $font-regular;
		height: calc($unit * 5.5);
	}

	:global([data-select-trigger].select.large) {
		padding: $unit-2x $unit-3x;
		font-size: $font-large;
		min-height: calc($unit * 6.5);
	}

	// Variant modifiers
	:global([data-select-trigger].select.contained) {
		background-color: var(--select-contained-bg);

		&:hover:not(.disabled) {
			background-color: var(--select-contained-bg-hover);
		}
	}

	// Other modifiers
	:global([data-select-trigger].select.full) {
		width: 100%;
	}

	:global([data-select-trigger].select.disabled) {
		opacity: 0.5;
		cursor: not-allowed;
	}

	:global([data-select-trigger].select[data-placeholder='true']) .text {
		color: var(--text-tertiary);
	}

	// Inner elements of select trigger
	:global([data-select-trigger].select) {
		.text {
			flex: 1;
			text-align: left;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}

		.image {
			width: $unit-3x;
			height: auto;
			flex-shrink: 0;
		}

		:global(.chevron) {
			flex-shrink: 0;
			color: var(--text-secondary);
			margin-left: auto;
		}
	}

	// Dropdown content styling
	:global([data-select-content].content) {
		background: var(--dialog-bg);
		border-radius: $card-corner;
		border: 1px solid rgba(0, 0, 0, 0.1);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
		padding: $unit-half;
		min-width: var(--bits-select-anchor-width);
		max-height: 40vh;
		overflow: auto;
		z-index: 50;
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
	:global([data-select-item].item) {
		align-items: center;
		border-radius: $item-corner-small;
		color: var(--text-primary);
		cursor: pointer;
		display: flex;
		gap: $unit;
		padding: $unit $unit-2x;
		user-select: none;
		@include smooth-transition($duration-quick, background-color);

		&:hover {
			background-color: var(--option-bg-hover);
		}

		&[data-disabled] {
			color: var(--text-tertiary);
			cursor: not-allowed;
			opacity: 0.5;
		}

		&[data-highlighted] {
			background-color: var(--option-bg-hover);
		}

		&[data-selected] {
			font-weight: $medium;
		}

		.text {
			flex: 1;
		}

		.image {
			width: $unit-3x;
			height: auto;
			flex-shrink: 0;
		}

		:global(.indicator) {
			margin-left: auto;
			color: var(--accent-blue);
		}
	}
</style>
