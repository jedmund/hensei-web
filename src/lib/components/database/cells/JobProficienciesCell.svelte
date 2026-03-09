
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
	@use '$src/themes/spacing' as spacing;

	.proficiencies-cell {
		display: flex;
		align-items: center;
		gap: spacing.$unit-half;
		height: 100%;
	}
</style>
