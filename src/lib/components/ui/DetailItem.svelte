<svelte:options runes={true} />

<script lang="ts">
	import type { Snippet } from 'svelte'

	let {
		label,
		value,
		children
	}: {
		label: string
		value?: string | number | undefined
		children?: Snippet
	} = $props()
</script>

<div class="detail-item">
	<span class="label">{label}</span>
	{#if children}
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

	.detail-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: spacing.$unit;
		background: colors.$grey-90;
		border-radius: layout.$item-corner;
		font-size: typography.$font-regular;

		&:hover {
			background: colors.$grey-80;
		}

		.label {
			font-weight: typography.$medium;
			color: colors.$grey-50;
		}

		.value {
			color: colors.$grey-30;
			display: flex;
			align-items: center;
		}
	}
</style>
