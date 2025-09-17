<svelte:options runes={true} />

<script lang="ts">
	import type { IRow } from 'wx-svelte-grid'
	import ProficiencyLabel from '$lib/components/labels/ProficiencyLabel.svelte'

	interface Props {
		row: IRow
	}

	const { row }: Props = $props()

	const proficiency = $derived(row.proficiency)
</script>

<div class="proficiency-cell">
	<ProficiencyLabel {proficiency} size="large" />
</div>

<style lang="scss">
	.proficiency-cell {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
	}
</style>