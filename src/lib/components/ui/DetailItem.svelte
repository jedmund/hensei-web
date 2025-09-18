<svelte:options runes={true} />

<script lang="ts">
	import type { Snippet } from 'svelte'
	import Input from './Input.svelte'
	import Select from './Select.svelte'

	interface SelectOption {
		value: string | number
		label: string
		disabled?: boolean
	}

	let {
		label,
		value = $bindable(),
		children,
		editable = false,
		type = 'text',
		options,
		placeholder
	}: {
		label: string
		value?: string | number | undefined
		children?: Snippet
		editable?: boolean
		type?: 'text' | 'number' | 'select' | 'checkbox'
		options?: SelectOption[]
		placeholder?: string
	} = $props()

	// For checkbox type, convert value to boolean
	let checkboxValue = $state(type === 'checkbox' ? Boolean(value) : false)

	$effect(() => {
		if (type === 'checkbox') {
			value = checkboxValue as any
		}
	})
</script>

<div class="detail-item" class:editable>
	<span class="label">{label}</span>
	{#if editable}
		<div class="edit-value">
			{#if type === 'select' && options}
				<Select bind:value {options} {placeholder} size="medium" contained />
			{:else if type === 'checkbox'}
				<label class="checkbox-wrapper">
					<input type="checkbox" bind:checked={checkboxValue} class="checkbox" />
					<span class="checkbox-label">{checkboxValue ? 'Yes' : 'No'}</span>
				</label>
			{:else if type === 'number'}
				<Input
					bind:value
					type="number"
					variant="number"
					bound={true}
					{placeholder}
					alignRight={true}
				/>
			{:else}
				<Input bind:value type="text" bound={true} {placeholder} alignRight={true} />
			{/if}
		</div>
	{:else if children}
		<div class="value">
			{@render children()}
		</div>
	{:else}
		<span class="value">{value || '—'}</span>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/colors' as colors;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/effects' as effects;

	.detail-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: spacing.$unit;
		background: colors.$grey-90;
		border-radius: layout.$item-corner;
		font-size: typography.$font-regular;
		min-height: calc(spacing.$unit * 5);

		&:hover:not(.editable) {
			background: colors.$grey-80;
		}

		&.editable:hover,
		&.editable:focus-within {
			background: var(--input-bg-hover);
		}

		&.editable {
			background: var(--input-bg);
		}

		.label {
			font-weight: typography.$medium;
			color: colors.$grey-50;
			flex-shrink: 0;
			margin-right: spacing.$unit-2x;
		}

		.value {
			color: colors.$grey-30;
			display: flex;
			align-items: center;
		}

		.edit-value {
			flex: 1;
			display: flex;
			flex-grow: 0;
			justify-content: flex-end;

			:global(.input),
			:global(.select) {
				min-width: 180px;
			}

			:global(.input.number) {
				min-width: 120px;
			}
		}

		.checkbox-wrapper {
			display: flex;
			align-items: center;
			gap: spacing.$unit;
			cursor: pointer;

			.checkbox {
				width: spacing.$unit-2x;
				height: spacing.$unit-2x;
				cursor: pointer;
			}

			.checkbox-label {
				color: var(--text-primary);
				user-select: none;
			}
		}
	}
</style>
