<svelte:options runes={true} />

<script lang="ts">
	import type { Cell } from 'wx-svelte-grid'
	import ProficiencyLabel from '$lib/components/labels/ProficiencyLabel.svelte'

	const { row }: Cell = $props()

	const proficiency = $derived(row.proficiency)
</script>

<div class="proficiency-cell">
	<ProficiencyLabel {proficiency} size="small" />
</div>

<style lang="scss">
	.proficiency-cell {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
	}
</style>
