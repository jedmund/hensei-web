<svelte:options runes={true} />

<script lang="ts">
	import type { IRow } from 'wx-svelte-grid'
	import UncapIndicator from '$lib/components/uncap/UncapIndicator.svelte'

	interface Props {
		row: IRow
	}

	let { row }: Props = $props()

	// For database view, show maximum possible uncap level
	const uncap = $derived(row.uncap ?? {})
	const flb = $derived(uncap.flb ?? false)
	const ulb = $derived(uncap.ulb ?? false)
	const transcendence = $derived(uncap.transcendence ?? false)

	// Calculate maximum uncap level based on available uncaps
	// Weapons: 3 base + FLB + ULB + transcendence
	const getMaxUncapLevel = () => {
		return transcendence ? 6 : ulb ? 5 : flb ? 4 : 3
	}

	const uncapLevel = $derived(getMaxUncapLevel())
	// For database view, show maximum transcendence stage when available
	const transcendenceStage = $derived(
		// First check if API provides direct transcendence_step field on the row
		row.transcendence_step ? row.transcendence_step :
		// Check if API provides specific max transcendence step in uncap object
		uncap.max_transcendence_step ? uncap.max_transcendence_step :
		// Otherwise, show maximum stage (5) when transcendence is available
		transcendence ? 5 : 0
	)
</script>

<div class="uncap-cell">
	<UncapIndicator
		type="weapon"
		{uncapLevel}
		{transcendenceStage}
		{flb}
		{ulb}
		{transcendence}
		editable={false}
	/>
</div>

<style lang="scss">
	.uncap-cell {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		padding: 4px;
	}
</style>