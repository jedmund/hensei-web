<script lang="ts">
	import type { Snippet } from 'svelte'

	interface Props {
		label: string
		value?: string | number | null | undefined
		children?: Snippet
		/** Disable hover state for editable rows */
		noHover?: boolean
		/** Remove padding for inline edit contexts */
		noPadding?: boolean
		/** Remove min-width from value (for compact controls like switches) */
		compact?: boolean
	}

	let { label, value, children, noHover = false, noPadding = false, compact = false }: Props = $props()
</script>

<div class="detail-row" class:no-hover={noHover} class:no-padding={noPadding} class:compact class:has-control={children}>
	<span class="label">{label}</span>
	<span class="value">
		{#if children}
			{@render children()}
		{:else}
			{value ?? '—'}
		{/if}
	</span>
</div>

<style lang="scss">
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.detail-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: spacing.$unit-2x;
		padding: calc(spacing.$unit * 1.5) spacing.$unit;

		&:not(.no-hover):hover {
			background: var(--page-hover);
			border-radius: layout.$item-corner;
		}

		&.no-padding {
			padding: 0;
		}

		&:last-child {
			border-bottom: none;
		}

		.label {
			font-size: typography.$font-regular;
			color: var(--text-secondary);
			flex: 1;
		}

		.value {
			font-size: typography.$font-regular;
			color: var(--text-primary);
			flex-shrink: 0;
			display: flex;
			justify-content: flex-end;
			align-items: center;
		}

		// Static value display (no children snippet)
		&:not(.has-control) .value {
			font-weight: typography.$medium;
			text-align: right;
		}

		&.compact .value {
			min-width: unset;
		}

		// Select controls inside DetailRow should have consistent width
		.value :global([data-select-trigger]) {
			min-width: 192px;
		}
	}
</style>
