<script lang="ts">
	import { Label } from 'bits-ui'
	import type { HTMLInputAttributes } from 'svelte/elements'
	import Icon from '../Icon.svelte'

	interface Props extends HTMLInputAttributes {
		variant?: 'default' | 'contained' | 'duration' | 'number' | 'range'
		contained?: boolean
		size?: 'small' | 'medium' | 'large'
		error?: string
		label?: string
		leftIcon?: string
		rightIcon?: string
		clearable?: boolean
		onClear?: () => void
		counter?: number
		maxLength?: number
		hidden?: boolean
		fullWidth?: boolean
		fullHeight?: boolean
		alignRight?: boolean
		accessory?: boolean
		no1password?: boolean
		validationState?: 'idle' | 'validating' | 'valid' | 'invalid'
		handleBlur?: () => void
		handleFocus?: () => void
		handleInput?: () => void
	}

	let {
		variant = 'default',
		contained = false,
		size = 'medium',
		error,
		label,
		leftIcon,
		rightIcon,
		clearable = false,
		onClear,
		counter,
		maxLength,
		hidden = false,
		fullWidth = false,
		fullHeight = false,
		alignRight = false,
		accessory = false,
		value = $bindable(),
		type = 'text',
		placeholder,
		disabled = false,
		readonly = false,
		required = false,
		class: className = '',
		no1password = false,
		validationState = 'idle',
		handleBlur,
		handleFocus,
		handleInput,
		...restProps
	}: Props = $props()

	// Determine the validation icon to show
	const validationIcon = $derived(
		validationState === 'validating'
			? 'loader-2'
			: validationState === 'valid'
				? 'check'
				: validationState === 'invalid'
					? 'close'
					: null
	)

	const currentCount = $derived(String(value ?? '').length)
	const charsRemaining = $derived(maxLength !== undefined ? maxLength - currentCount : undefined)
	const showCounter = $derived(
		counter !== undefined || (charsRemaining !== undefined && charsRemaining <= 5)
	)
	const hasWrapper = $derived(
		accessory || leftIcon || rightIcon || clearable || maxLength !== undefined || validationIcon
	)

	function handleClear() {
		value = ''
		onClear?.()
	}

	// Select all text on focus for easier editing
	function onFocus(event: FocusEvent) {
		const input = event.currentTarget as HTMLInputElement
		input.select()
		handleFocus?.()
	}

	const fieldsetClasses = $derived(
		['fieldset', hidden && 'hidden', fullWidth && 'full', className].filter(Boolean).join(' ')
	)

	const inputClasses = $derived(
		[
			'input',
			size,
			(variant === 'contained' || contained) && 'contained',
			variant === 'duration' && 'duration',
			variant === 'number' && 'number',
			variant === 'range' && 'range',
			alignRight && 'alignRight',
			fullHeight && 'fullHeight',
			accessory && 'accessory',
			hasWrapper && 'wrapper',
			className
		]
			.filter(Boolean)
			.join(' ')
	)
</script>

<fieldset class={fieldsetClasses}>
	{#if label}
		<Label.Root class="label" for={restProps.id}>
			{label}
			{#if required}
				<span class="required">*</span>
			{/if}
		</Label.Root>
	{/if}

	{#if hasWrapper}
		<div class={inputClasses}>
			{#if leftIcon}
				<span class="iconLeft">
					<Icon name={leftIcon} size={16} />
				</span>
			{/if}

			<input
				bind:value
				{type}
				{placeholder}
				{disabled}
				{readonly}
				{required}
				maxlength={maxLength}
				data-1p-ignore={no1password}
				onblur={handleBlur}
				onfocus={onFocus}
				oninput={handleInput}
				{...restProps}
			/>

			{#if rightIcon}
				<span class="iconRight">
					<Icon name={rightIcon} size={16} />
				</span>
			{/if}

			{#if validationIcon}
				<span class="validationIcon {validationState}">
					<Icon name={validationIcon} size={16} />
				</span>
			{/if}

			{#if clearable && value}
				<button type="button" class="clearButton" onclick={handleClear}>
					<Icon name="close" size={14} />
				</button>
			{/if}

			{#if showCounter}
				<span class="counter" class:warning={charsRemaining !== undefined && charsRemaining <= 5}>
					{charsRemaining !== undefined ? charsRemaining : currentCount}
				</span>
			{/if}
		</div>
	{:else}
		<input
			bind:value
			class={inputClasses}
			{type}
			{placeholder}
			{disabled}
			{readonly}
			{required}
			maxlength={maxLength}
			data-1p-ignore={no1password}
			onblur={handleBlur}
			onfocus={onFocus}
			oninput={handleInput}
			{...restProps}
		/>
	{/if}

	{#if error}
		<span class="error">{error}</span>
	{/if}
</fieldset>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/colors' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/mixins' as *;
	@use '$src/themes/effects' as *;

	.fieldset {
		display: flex;
		flex-direction: column;
		gap: $unit-half;
		border: none;
		padding: 0;
		margin: 0;

		&:last-child .error {
			margin-bottom: 0;
		}

		&.hidden {
			display: none;
		}

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
			display: none;
		}

		.error {
			color: $error;
			font-size: $font-small;
			padding: $unit-half $unit-2x;
			min-width: 100%;
			margin-bottom: $unit;
			width: 0;
		}
	}

	// Root level .input styles for standalone inputs
	.input {
		-webkit-font-smoothing: antialiased;
		background-color: var(--input-bg);
		border-radius: $input-corner;
		border: none;
		box-sizing: border-box;
		color: var(--text-primary);
		display: block;
		font-family: var(--font-family);
		width: 100%;
		@include smooth-transition($duration-quick, background-color);

		&.fullHeight {
			height: 100%;
		}

		&.accessory,
		&.wrapper {
			align-items: center;
			background: var(--input-bg);
			border-radius: $input-corner;
			box-sizing: border-box;
			position: relative;
			display: flex;
			padding: 0;

			.counter {
				color: var(--text-tertiary);
				display: flex;
				align-items: center;
				font-weight: $normal;
				font-size: $font-small;
				position: absolute;
				right: $unit-2x;
				top: 0;
				bottom: 0;
				pointer-events: none;

				&.warning {
					background: $error;
					color: white;
					padding: 0 $unit-half;
					border-radius: $unit-half;
					top: 50%;
					bottom: auto;
					transform: translateY(-50%);
				}
			}

			input {
				background: transparent;
				border-radius: $input-corner;
				box-sizing: border-box;
				color: var(--text-primary);
				width: 100%;
				font-family: inherit;
				@include smooth-transition($duration-quick, border-color);

				&:focus {
					// @include focus-ring($blue);
				}
			}

			.iconLeft,
			.iconRight {
				position: absolute;
				display: flex;
				align-items: center;
				pointer-events: none;
				color: var(--text-secondary);

				:global(svg) {
					fill: currentColor;
				}
			}

			.iconLeft {
				left: $unit-2x;
			}

			.iconRight {
				right: $unit-2x;
			}

			.validationIcon {
				position: absolute;
				right: $unit-2x;
				display: flex;
				align-items: center;
				pointer-events: none;

				:global(svg) {
					fill: currentColor;
				}

				&.valid {
					color: $wind-text-20;
				}

				&.invalid {
					color: $error;
				}

				&.validating {
					color: var(--text-tertiary);

					:global(svg) {
						animation: spin 1s linear infinite;
					}
				}
			}

			.clearButton {
				position: absolute;
				right: $unit-2x;
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

			input {
				border: 2px solid transparent;
			}
		}

		&[type='number']::-webkit-inner-spin-button {
			-webkit-appearance: none;
		}

		&.contained {
			background-color: var(--input-bound-bg);

			&:hover:not(:disabled) {
				background-color: var(--input-bound-bg-hover);
			}

			// For wrapper variant with contained
			&.wrapper {
				background-color: var(--input-bound-bg);

				&:hover:not(:has(input:disabled)) {
					background-color: var(--input-bound-bg-hover);
				}
			}
		}

		&.duration {
			background: transparent;
			border: none;
			padding: 0;
			width: initial;
			height: 100%;
			padding: calc($unit-2x - 2px) 0;

			&:hover {
				background: transparent;
			}

			&:focus,
			&:focus-visible {
				border: none;
			}
		}

		&.number {
			text-align: right;
			width: $unit-8x;
		}

		&.range {
			text-align: right;
			width: $unit-12x;
		}

		&.alignRight {
			text-align: right;
		}

		&:hover:not(:disabled):not(.contained) {
			background-color: var(--input-bg-hover);
		}

		&:focus {
			// @include focus-ring($blue);
		}

		&:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}

		// Size variants
		&.small {
			font-size: $font-small;
			min-height: $unit-3x;

			&:not(.wrapper) {
				padding: $unit-half $unit;
			}

			&.wrapper input,
			&.accessory input {
				padding: $unit-half $unit;
				font-size: $font-small;
			}

			&:has(.iconLeft) input {
				padding-left: $unit-4x;
			}

			&:has(.iconRight) input,
			&:has(.validationIcon) input,
			&:has(.clearButton) input {
				padding-right: $unit-4x;
			}

			&:has(.counter) input {
				padding-right: $unit-6x;
			}
		}

		&.medium {
			font-size: $font-regular;
			min-height: $unit-4x;

			&:not(.wrapper) {
				padding: $unit calc($unit * 1.5);
			}

			&.wrapper input,
			&.accessory input {
				padding: $unit calc($unit * 1.5);
				font-size: $font-regular;
			}

			&:has(.iconLeft) input {
				padding-left: $unit-5x;
			}

			&:has(.iconRight) input,
			&:has(.validationIcon) input,
			&:has(.clearButton) input {
				padding-right: $unit-5x;
			}

			&:has(.counter) input {
				padding-right: $unit-8x;
			}
		}

		&.large {
			font-size: $font-large;
			min-height: calc($unit * 6);

			&:not(.wrapper) {
				padding: $unit-2x $unit-3x;
			}

			&.wrapper input,
			&.accessory input {
				padding: $unit-2x $unit-3x;
				font-size: $font-large;
			}

			&:has(.iconLeft) input {
				padding-left: $unit-6x;
			}

			&:has(.iconRight) input,
			&:has(.validationIcon) input,
			&:has(.clearButton) input {
				padding-right: $unit-6x;
			}

			&:has(.counter) input {
				padding-right: $unit-10x;
			}
		}
	}

	// Direct input element styles
	input.input {
		-webkit-font-smoothing: antialiased;
		background-color: var(--input-bg);
		border-radius: $input-corner;
		border: 2px solid transparent;
		box-sizing: border-box;
		color: var(--text-primary);
		display: block;
		font-family: var(--font-family);
		width: 100%;
		@include smooth-transition($duration-quick, background-color);

		&[type='number']::-webkit-inner-spin-button {
			-webkit-appearance: none;
		}

		&.contained {
			background-color: var(--input-bound-bg);

			&:hover:not(:disabled) {
				background-color: var(--input-bound-bg-hover);
			}
		}

		&.duration {
			background: transparent;
			border: none;
			padding: calc($unit-2x - 2px) 0;
			width: initial;
			height: 100%;

			&:hover {
				background: transparent;
			}

			&:focus,
			&:focus-visible {
				border: none;
			}
		}

		&.number {
			text-align: right;
			width: $unit-8x;
		}

		&.range {
			text-align: right;
			width: $unit-12x;
		}

		&.alignRight {
			text-align: right;
		}

		&.fullHeight {
			height: 100%;
		}

		&:hover:not(:disabled):not(.contained) {
			background-color: var(--input-bg-hover);
		}

		&:focus {
			// @include focus-ring($blue);
		}

		&:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}

		// Size variants
		&.small {
			padding: $unit-half $unit;
			font-size: $font-small;
			min-height: $unit-3x;
		}

		&.medium {
			padding: $unit calc($unit * 1.5);
			font-size: $font-regular;
			min-height: $unit-4x;
		}

		&.large {
			padding: $unit-2x $unit-3x;
			font-size: $font-large;
			min-height: calc($unit * 6);
		}
	}

	// Placeholder styles
	.input::placeholder,
	.input > input::placeholder,
	input.input::placeholder {
		color: var(--text-tertiary);
		opacity: 1;
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
