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

<div class="detail-row" class:no-hover={noHover} class:no-padding={noPadding} class:compact>
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
	@use '$src/themes/colors' as colors;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.detail-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
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
			color: var(--text-secondary, colors.$grey-50);
		}

		.value {
			font-size: typography.$font-regular;
			color: var(--text-primary, colors.$grey-10);
			font-weight: typography.$medium;
			text-align: right;
			min-width: 180px;
		}

		&.compact .value {
			min-width: unset;
		}
	}
</style>
