<!-- Typeahead Component (Svelecte wrapper) -->

<script lang="ts" generics="T extends object">
	import Svelecte from 'svelecte';
	import { Label } from 'bits-ui';

	interface Props {
		/** Array of options to select from */
		options?: T[];
		/** Currently selected value(s) */
		value?: T | T[] | null;
		/** Callback when value changes */
		onValueChange?: (value: T | T[] | null) => void;
		/** Field to use as display label (default: 'label') */
		labelField?: string;
		/** Field to use as value (default: 'value') */
		valueField?: string;
		/** Enable search/filtering */
		searchable?: boolean;
		/** Allow multiple selections */
		multiple?: boolean;
		/** Allow creating new options */
		creatable?: boolean;
		/** Maximum number of selected items (for multiple mode) */
		max?: number;
		/** Placeholder text */
		placeholder?: string;
		/** Disabled state */
		disabled?: boolean;
		/** Clear button visible */
		clearable?: boolean;
		/** Component size */
		size?: 'small' | 'medium' | 'large';
		/** Contained background style */
		contained?: boolean;
		/** Full width */
		fullWidth?: boolean;
		/** Field label */
		label?: string;
		/** Error message */
		error?: string;
		/** Required field */
		required?: boolean;
		/** Additional CSS class */
		class?: string;
		/** Custom filter function */
		filterFunction?: (item: T, inputValue: string) => boolean;
	}

	let {
		options = [],
		value = $bindable(null),
		onValueChange,
		labelField = 'label',
		valueField = 'value',
		searchable = true,
		multiple = false,
		creatable = false,
		max,
		placeholder = 'Select...',
		disabled = false,
		clearable = true,
		size = 'medium',
		contained = false,
		fullWidth = false,
		label,
		error,
		required = false,
		class: className = '',
		filterFunction
	}: Props = $props();

	const hasWrapper = $derived(label || error);

	const fieldsetClasses = $derived(
		['fieldset', fullWidth && 'full', className].filter(Boolean).join(' ')
	);

	const typeaheadClasses = $derived(
		['typeahead', size, contained && 'contained', fullWidth && 'full', disabled && 'disabled']
			.filter(Boolean)
			.join(' ')
	);

	function handleChange(newValue: T | T[] | null) {
		value = newValue;
		onValueChange?.(newValue);
	}
</script>

{#if hasWrapper}
	<fieldset class={fieldsetClasses}>
		{#if label}
			<Label.Root class="label">
				{label}
				{#if required}
					<span class="required">*</span>
				{/if}
			</Label.Root>
		{/if}

		<div class={typeaheadClasses}>
			<Svelecte
				{options}
				{value}
				{labelField}
				{valueField}
				{searchable}
				{multiple}
				{creatable}
				{max}
				{placeholder}
				{disabled}
				{clearable}
				onChange={handleChange}
			/>
		</div>

		{#if error}
			<span class="error">{error}</span>
		{/if}
	</fieldset>
{:else}
	<div class={typeaheadClasses}>
		<Svelecte
			{options}
			{value}
			{labelField}
			{valueField}
			{searchable}
			{multiple}
			{creatable}
			{max}
			{placeholder}
			{disabled}
			{clearable}
			onChange={handleChange}
		/>
	</div>
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

	// Typeahead wrapper
	.typeahead {
		width: 100%;

		&.full {
			width: 100%;
		}

		&.disabled {
			opacity: 0.5;
			pointer-events: none;
		}
	}

	// Svelecte overrides - using CSS custom properties
	.typeahead {
		// Control (trigger) styling
		--sv-bg: var(--input-bg);
		--sv-border-color: transparent;
		--sv-border: 2px solid var(--sv-border-color);
		--sv-active-border: 2px solid #{$blue};
		--sv-active-outline: none;
		--sv-border-radius: #{$input-corner};
		--sv-min-height: calc(#{$unit} * 5.5);
		--sv-placeholder-color: var(--text-tertiary);
		--sv-color: var(--text-primary);

		// Dropdown styling
		--sv-dropdown-bg: var(--dialog-bg);
		--sv-dropdown-border-radius: #{$card-corner};
		--sv-dropdown-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
		--sv-dropdown-offset: #{$unit-half};

		// Item styling
		--sv-item-color: var(--text-primary);
		--sv-item-active-bg: var(--option-bg-hover);
		--sv-item-selected-bg: var(--option-bg-hover);

		// Clear/indicator styling
		--sv-icon-color: var(--text-secondary);
		--sv-icon-hover-color: var(--text-primary);

		// Selected tag styling (for multiple)
		--sv-item-wrap-padding: #{$unit-half} #{$unit};
		--sv-selected-bg: var(--button-bg);
		--sv-selected-color: var(--text-primary);
	}

	// Size: Small
	.typeahead.small {
		--sv-min-height: calc(#{$unit} * 3.5);
		--sv-font-size: #{$font-small};
	}

	// Size: Medium
	.typeahead.medium {
		--sv-min-height: calc(#{$unit} * 5.5);
		--sv-font-size: #{$font-regular};
	}

	// Size: Large
	.typeahead.large {
		--sv-min-height: calc(#{$unit} * 6.5);
		--sv-font-size: #{$font-large};
	}

	// Contained variant
	.typeahead.contained {
		--sv-bg: var(--input-bound-bg);

		&:hover {
			--sv-bg: var(--input-bound-bg-hover);
		}
	}
</style>
