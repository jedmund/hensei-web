<svelte:options runes={true} />

<script lang="ts">
	import type { Snippet } from 'svelte'
	import Input from './Input.svelte'
	import Select from './Select.svelte'
	import Checkbox from './checkbox/Checkbox.svelte'
	import CheckboxGroup from './checkbox/CheckboxGroup.svelte'
	import DatePicker from './DatePicker.svelte'
	import Icon from '../Icon.svelte'

	interface SelectOption {
		value: string | number
		label: string
		disabled?: boolean
	}

	let {
		label,
		sublabel,
		value = $bindable(),
		children,
		editable = false,
		type = 'text',
		options,
		placeholder,
		element,
		onchange,
		width,
		linkUrl,
		hasLinkButton = false,
		min,
		max
	}: {
		label: string
		/** Secondary label displayed below the main label */
		sublabel?: string
		value?: string | number | boolean | number[] | null | undefined
		children?: Snippet
		editable?: boolean
		type?: 'text' | 'number' | 'select' | 'checkbox' | 'date' | 'multiselect'
		options?: SelectOption[]
		placeholder?: string
		element?: 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'
		/** Callback for checkbox type when value changes */
		onchange?: (checked: boolean) => void
		/** Custom width for the input field (e.g., '320px') */
		width?: string
		/** URL to open when link button is clicked */
		linkUrl?: string | null
		/** Whether to show the link button (disabled when linkUrl is empty) */
		hasLinkButton?: boolean
		/** Minimum value for number inputs */
		min?: number
		/** Maximum value for number inputs */
		max?: number
	} = $props()

	// For checkbox type, derive the checked state from value
	// This ensures external changes to value are reflected in the checkbox
	const checkboxValue = $derived(type === 'checkbox' ? Boolean(value) : false)

	// Show link button when hasLinkButton is true or linkUrl is provided
	const showLinkButton = $derived(hasLinkButton || !!linkUrl)
	const linkDisabled = $derived(!linkUrl)

	// Handle checkbox change and call onchange if provided
	function handleCheckboxChange(checked: boolean) {
		value = checked as any
		onchange?.(checked)
	}

	// Open URL in new tab
	function openLink() {
		if (linkUrl) {
			window.open(linkUrl, '_blank', 'noopener,noreferrer')
		}
	}
</script>

<div class="detail-item" class:editable class:hasChildren={!!children}>
	<div class="label-container">
		<span class="label">{label}</span>
		{#if sublabel}
			<span class="sublabel">{sublabel}</span>
		{/if}
	</div>
	{#if editable}
		<div class="edit-value" style:--custom-width={width}>
			{#if type === 'select' && options}
				<Select
					bind:value={value as string | number | undefined}
					{options}
					{placeholder}
					size="medium"
					contained
				/>
			{:else if type === 'multiselect' && options}
				<CheckboxGroup
					bind:value={value as number[]}
					options={options as { value: number; label: string }[]}
					{element}
				/>
			{:else if type === 'checkbox'}
				<Checkbox
					checked={checkboxValue}
					onCheckedChange={handleCheckboxChange}
					contained
					{element}
				/>
			{:else if type === 'number'}
				<Input
					bind:value
					type="number"
					variant="number"
					contained={true}
					{placeholder}
					alignRight={true}
					{min}
					{max}
				/>
			{:else if type === 'date'}
				<DatePicker bind:value={value as string | null} contained={true} {placeholder} />
			{:else if children}
				{@render children()}
			{:else}
				<Input bind:value type="text" contained={true} {placeholder} alignRight={false} />
				{#if showLinkButton}
					<button
						type="button"
						class="link-button"
						onclick={openLink}
						disabled={linkDisabled}
						title={linkDisabled ? 'No link available' : 'Open link'}
					>
						<Icon name="link" size={16} />
					</button>
				{/if}
			{/if}
		</div>
	{:else if children}
		<div class="value" class:edit-value={editable}>
			{@render children()}
		</div>
	{:else}
		<span class="value">{value || '—'}</span>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/effects' as effects;

	.detail-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: spacing.$unit 0;
		border-radius: layout.$item-corner;
		font-size: typography.$font-regular;
		min-height: calc(spacing.$unit * 5);

		&:not(.editable) {
			padding: spacing.$unit;
			margin: 0 calc(spacing.$unit * -1);
		}

		&:hover:not(.editable):not(.hasChildren) {
			background: var(--background);
		}

		&.editable,
		&.hasChildren {
			background: var(--input-bg);
		}

		.label-container {
			display: flex;
			flex-direction: column;
			flex-shrink: 0;
			margin-right: spacing.$unit-2x;
			gap: spacing.$unit-fourth;
		}

		.label {
			font-weight: typography.$medium;
			color: var(--text-secondary);
		}

		.sublabel {
			font-size: typography.$font-small;
			color: var(--text-tertiary);
			font-weight: typography.$normal;
		}

		.value {
			color: var(--text-primary);
			display: flex;
			align-items: center;
		}

		.edit-value {
			flex: 1;
			display: flex;
			flex-grow: 0;
			justify-content: flex-end;
			align-items: center;
			gap: spacing.$unit-half;

			:global(.input),
			:global(.select),
			:global(.multi-select),
			:global(.character-typeahead),
			:global(.weapon-typeahead) {
				width: var(--custom-width, 240px);
			}

			:global(.input.number) {
				width: var(--custom-width, 120px);
			}

			.link-button {
				display: flex;
				align-items: center;
				justify-content: center;
				width: 42px;
				height: 42px;
				padding: 0;
				border: none;
				border-radius: layout.$item-corner;
				background: transparent;
				color: var(--text-secondary);
				cursor: pointer;
				flex-shrink: 0;
				@include effects.smooth-transition(effects.$duration-quick, background-color, color, opacity);

				&:hover:not(:disabled) {
					background: var(--background);
					color: var(--text-primary);
				}

				&:active:not(:disabled) {
					background: var(--placeholder-bg);
				}

				&:disabled {
					cursor: not-allowed;
					opacity: 0.4;
				}
			}
		}
	}
</style>
