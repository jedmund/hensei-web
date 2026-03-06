<svelte:options runes={true} />

<script lang="ts">
	import type { Cell } from 'wx-svelte-grid'
	import { getJobTierName } from '$lib/utils/jobUtils'

	const { row }: Cell = $props()
	const tierName = $derived(getJobTierName(row.row))
</script>

<div class="tier-cell">
	<span class="tier-badge">{tierName}</span>
</div>

<style lang="scss">
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.tier-cell {
		display: flex;
		align-items: center;
		height: 100%;
	}

	.tier-badge {
		display: inline-block;
		padding: 2px 8px;
		background: var(--background);
		border-radius: layout.$item-corner-small;
		font-size: typography.$font-small;
		color: var(--text-primary);
	}
</style>
