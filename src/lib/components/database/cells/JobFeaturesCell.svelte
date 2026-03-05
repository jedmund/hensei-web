<svelte:options runes={true} />

<script lang="ts">
	import type { Cell } from 'wx-svelte-grid'

	const { row }: Cell = $props()
</script>

<div class="features-cell">
	{#if row.masterLevel}
		<span class="badge master">Master</span>
	{/if}
	{#if row.ultimateMastery}
		<span class="badge ultimate">Ultimate</span>
	{/if}
	{#if row.accessory}
		<span class="badge accessory">Accessory</span>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/colors' as colors;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;

	.features-cell {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: spacing.$unit-half;
		height: 100%;
	}

	.badge {
		display: inline-block;
		padding: 2px 6px;
		border-radius: layout.$item-corner-small;
		font-size: typography.$font-tiny;
		font-weight: typography.$medium;

		&.master {
			background: colors.$yellow;
			color: white;
		}

		&.ultimate {
			background: colors.$dark-bg-00;
			color: white;
		}

		&.accessory {
			background: colors.$blue;
			color: white;
		}
	}
</style>
