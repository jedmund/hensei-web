<svelte:options runes={true} />

<script lang="ts">
	import Icon from '$lib/components/Icon.svelte'

	interface Props {
		/** Primary label text */
		label: string
		/** Optional secondary label/description */
		sublabel?: string
		/** Value displayed on the right side (before the chevron) */
		value?: string
		/** Click handler - typically pushes a new pane */
		onclick?: () => void
		/** Whether the row is disabled */
		disabled?: boolean
		/** Element color for styling (optional) */
		element?: 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'
	}

	const { label, sublabel, value, onclick, disabled = false, element }: Props = $props()
</script>

<button
	type="button"
	class="disclosure-row"
	class:disabled
	class:element-wind={element === 'wind'}
	class:element-fire={element === 'fire'}
	class:element-water={element === 'water'}
	class:element-earth={element === 'earth'}
	class:element-dark={element === 'dark'}
	class:element-light={element === 'light'}
	{onclick}
	{disabled}
>
	<div class="label-container">
		<span class="label">{label}</span>
		{#if sublabel}
			<span class="sublabel">{sublabel}</span>
		{/if}
	</div>
	<div class="value-area">
		{#if value}
			<span class="value">{value}</span>
		{/if}
		<Icon name="chevron-right" size={16} />
	</div>
</button>

<style lang="scss">
	@use '$src/themes/colors' as colors;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/effects' as effects;

	.disclosure-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: spacing.$unit-2x;
		margin: 0 calc(spacing.$unit * -1);
		padding: spacing.$unit;
		border-radius: layout.$item-corner;
		font-size: typography.$font-regular;
		min-height: calc(spacing.$unit * 5);
		background: transparent;
		border: none;
		cursor: pointer;
		text-align: left;
		transition: background-color effects.$duration-quick ease;

		&:hover:not(.disabled) {
			background: colors.$grey-90;
		}

		&:active:not(.disabled) {
			background: colors.$grey-85;
		}

		&.disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}

		.label-container {
			display: flex;
			flex-direction: column;
			flex: 1;
			min-width: 0;
			gap: spacing.$unit-fourth;
		}

		.label {
			font-weight: typography.$medium;
			color: colors.$grey-30;
			word-wrap: break-word;
			overflow-wrap: break-word;
		}

		.sublabel {
			font-size: typography.$font-small;
			color: var(--text-tertiary);
			font-weight: typography.$normal;
		}

		.value-area {
			display: flex;
			align-items: center;
			gap: spacing.$unit-half;
			color: var(--text-secondary);
			flex-shrink: 0;
		}

		.value {
			font-size: typography.$font-regular;
			color: var(--text-secondary);
		}

		// Element-colored value
		&.element-wind .value {
			color: colors.$wind-text-20;
		}
		&.element-fire .value {
			color: colors.$fire-text-20;
		}
		&.element-water .value {
			color: colors.$water-text-20;
		}
		&.element-earth .value {
			color: colors.$earth-text-20;
		}
		&.element-dark .value {
			color: colors.$dark-text-20;
		}
		&.element-light .value {
			color: colors.$light-text-20;
		}
	}
</style>
