<script lang="ts">
	import { Label } from 'bits-ui'
	import type { HTMLInputAttributes } from 'svelte/elements'
	import Icon from '../Icon.svelte'

	interface Props extends HTMLInputAttributes {
		variant?: 'default' | 'bound' | 'duration' | 'number' | 'range'
		bound?: boolean
		error?: string
		label?: string
		leftIcon?: string
		rightIcon?: string
		counter?: number
		maxLength?: number
		hidden?: boolean
		fullWidth?: boolean
		fullHeight?: boolean
		alignRight?: boolean
		accessory?: boolean
	}

	let {
		variant = 'default',
		bound = false,
		error,
		label,
		leftIcon,
		rightIcon,
		counter,
		maxLength,
		hidden = false,
		fullWidth = false,
		fullHeight = false,
		alignRight = false,
		accessory = false,
		value = $bindable(''),
		type = 'text',
		placeholder,
		disabled = false,
		readonly = false,
		required = false,
		class: className = '',
		...restProps
	}: Props = $props()

	const showCounter = $derived(counter !== undefined || maxLength !== undefined)
	const currentCount = $derived(String(value).length)
	const hasWrapper = $derived(accessory || leftIcon || rightIcon || showCounter)

	const fieldsetClasses = $derived(
		['fieldset', hidden && 'hidden', fullWidth && 'full', className].filter(Boolean).join(' ')
	)

	const inputClasses = $derived(
		[
			'input',
			(variant === 'bound' || bound) && 'bound',
			variant === 'duration' && 'duration',
			variant === 'number' && 'number',
			variant === 'range' && 'range',
			alignRight && 'alignRight',
			fullHeight && 'fullHeight',
			accessory && 'accessory',
			hasWrapper && 'wrapper'
		]
			.filter(Boolean)
			.join(' ')
	)
</script>

{#if label || error}
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
					{maxLength}
					{...restProps}
				/>

				{#if rightIcon}
					<span class="iconRight">
						<Icon name={rightIcon} size={16} />
					</span>
				{/if}

				{#if showCounter}
					<span class="counter">
						{currentCount}{maxLength ? `/${maxLength}` : ''}
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
				{maxLength}
				{...restProps}
			/>
		{/if}

		{#if error}
			<span class="error">{error}</span>
		{/if}
	</fieldset>
{:else if hasWrapper}
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
			{maxLength}
			{...restProps}
		/>

		{#if rightIcon}
			<span class="iconRight">
				<Icon name={rightIcon} size={16} />
			</span>
		{/if}

		{#if showCounter}
			<span class="counter">
				{currentCount}{maxLength ? `/${maxLength}` : ''}
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
		{maxLength}
		{...restProps}
	/>
{/if}

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
		font-size: $font-regular;
		width: 100%;
		@include smooth-transition($duration-quick, background-color);

		&:not(.wrapper) {
			padding: calc($unit * 1.5) $unit-2x;
		}

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
				display: block;
				font-weight: $bold;
				line-height: calc($unit * 6);
				position: absolute;
				right: $unit-2x;
				top: 0;
				pointer-events: none;
			}

			input {
				background: transparent;
				border-radius: $input-corner;
				// border: 2px solid transparent;
				box-sizing: border-box;
				color: var(--text-primary);
				padding: calc($unit * 1.75) $unit-2x;
				width: 100%;
				font-size: $font-regular;
				font-family: inherit;
				@include smooth-transition($duration-quick, border-color);

				&:focus {
					@include focus-ring($blue);
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

			&:has(.iconLeft) input {
				padding-left: $unit-5x;
			}

			&:has(.iconRight) input {
				padding-right: $unit-5x;
			}

			&:has(.counter) input {
				padding-right: $unit-8x;
			}
		}

		&[type='number']::-webkit-inner-spin-button {
			-webkit-appearance: none;
		}

		&.bound {
			background-color: var(--input-bound-bg);

			&:hover:not(:disabled) {
				background-color: var(--input-bound-bg-hover);
			}

			// For wrapper variant with bound
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

		&:hover:not(:disabled):not(.bound) {
			background-color: var(--input-bg-hover);
		}

		&:focus {
			@include focus-ring($blue);
		}

		&:disabled {
			opacity: 0.5;
			cursor: not-allowed;
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
		font-size: $font-regular;
		width: 100%;
		padding: calc($unit * 1.5) $unit-2x;
		@include smooth-transition($duration-quick, background-color);

		&[type='number']::-webkit-inner-spin-button {
			-webkit-appearance: none;
		}

		&.bound {
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

		&:hover:not(:disabled):not(.bound) {
			background-color: var(--input-bg-hover);
		}

		&:focus {
			@include focus-ring($blue);
		}

		&:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
	}

	// Placeholder styles
	.input::placeholder,
	.input > input::placeholder,
	input.input::placeholder {
		color: var(--text-tertiary);
		opacity: 1;
	}
</style>
