<svelte:options runes={true} />

<script lang="ts">
	import { Tooltip } from 'bits-ui'
	import Input from './Input.svelte'

	interface Props {
		value: string
		placeholder?: string
		onValidate: (value: string) => Promise<{ valid: boolean; message: string }>
		minLength?: number
		contained?: boolean
		alignRight?: boolean
	}

	let {
		value = $bindable(''),
		placeholder,
		onValidate,
		minLength = 0,
		contained = false,
		alignRight = false
	}: Props = $props()

	let validationState = $state<'idle' | 'validating' | 'valid' | 'invalid'>('idle')
	let validationMessage = $state('')
	let tooltipOpen = $state(false)
	let tooltipTimeout: ReturnType<typeof setTimeout> | null = null

	async function handleBlur() {
		// Only validate if value meets minimum length
		if (value.length < minLength) {
			validationState = 'idle'
			validationMessage = ''
			return
		}

		validationState = 'validating'
		hideTooltip()

		try {
			const result = await onValidate(value)
			validationState = result.valid ? 'valid' : 'invalid'
			validationMessage = result.message
			showTooltip()
		} catch (error) {
			console.error('[ValidatedInput] Validation error:', error)
			validationState = 'invalid'
			validationMessage = 'Validation failed'
			showTooltip()
		}
	}

	function handleFocus() {
		// Hide tooltip when focusing back into input
		hideTooltip()
	}

	function handleInput() {
		// Reset validation state when user types
		if (validationState !== 'idle') {
			validationState = 'idle'
			validationMessage = ''
			hideTooltip()
		}
	}

	function showTooltip() {
		tooltipOpen = true
		// Auto-dismiss after 3 seconds
		if (tooltipTimeout) clearTimeout(tooltipTimeout)
		tooltipTimeout = setTimeout(() => {
			tooltipOpen = false
		}, 3000)
	}

	function hideTooltip() {
		tooltipOpen = false
		if (tooltipTimeout) {
			clearTimeout(tooltipTimeout)
			tooltipTimeout = null
		}
	}

	// Cleanup on unmount
	$effect(() => {
		return () => {
			if (tooltipTimeout) clearTimeout(tooltipTimeout)
		}
	})
</script>

<div class="validated-input">
	<Input
		bind:value
		type="text"
		{placeholder}
		{contained}
		{alignRight}
		{validationState}
		{handleBlur}
		{handleFocus}
		{handleInput}
	/>
	{#if tooltipOpen && validationMessage}
		<div class="validation-message {validationState}">
			{validationMessage}
		</div>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/colors' as *;
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;

	.validated-input {
		width: 240px;
	}

	.validation-message {
		margin-top: $unit-half;
		padding: $unit-half $unit;
		border-radius: $item-corner-small;
		font-size: $font-small;
		font-weight: $medium;

		&.valid {
			background: $wind-bg-20;
			color: $wind-text-20;
		}

		&.invalid {
			background: $error--bg--light;
			color: $error;
		}
	}
</style>
