<svelte:options runes={true} />

<script lang="ts">
	import type { Cell } from 'wx-svelte-grid'
	import ProficiencyLabel from '$lib/components/labels/ProficiencyLabel.svelte'

	const { row }: Cell = $props()
</script>

<div class="proficiencies-cell">
	{#if row.proficiency?.[0]}
		<ProficiencyLabel proficiency={row.proficiency[0]} size="small" />
	{/if}
	{#if row.proficiency?.[1]}
		<ProficiencyLabel proficiency={row.proficiency[1]} size="small" />
	{/if}
</div>

<style lang="scss">
	.proficiencies-cell {
		display: flex;
		align-items: center;
		gap: 4px;
		height: 100%;
	}
</style>
