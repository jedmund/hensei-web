<svelte:options runes={true} />

<script lang="ts">
	import type { IRow } from 'wx-svelte-grid'
	import UncapIndicator from '$lib/components/uncap/UncapIndicator.svelte'

	interface Props {
		row: IRow
	}

	let { row }: Props = $props()

	// For database view, show maximum possible uncap level
	// Not the user's current uncap level
	const uncap = $derived(row.uncap ?? {})
	const flb = $derived(uncap.flb ?? false)
	const ulb = $derived(uncap.ulb ?? false)
	const transcendence = $derived(uncap.transcendence ?? false)
	const special = $derived(row.special ?? false)

	// Calculate maximum uncap level based on available uncaps
	const getMaxUncapLevel = () => {
		if (special) {
			// Special characters: 3 base + FLB + ULB
			return ulb ? 5 : flb ? 4 : 3
		} else {
			// Regular characters: 4 base + FLB + ULB/transcendence
			return ulb ? 6 : flb ? 5 : 4
		}
	}

	const uncapLevel = $derived(getMaxUncapLevel())
	// For database view, show maximum transcendence stage when available
	// Only regular (non-special) characters have transcendence
	const transcendenceStage = $derived(
		// Special characters don't have transcendence
		special ? 0 :
		// First check if API provides direct transcendence_step field on the row
		row.transcendence_step ? row.transcendence_step :
		// Check if API provides specific max transcendence step in uncap object
		uncap.max_transcendence_step ? uncap.max_transcendence_step :
		// Otherwise, show maximum stage (5) when transcendence is available for regular characters
		transcendence ? 5 : 0
	)
</script>

<div class="uncap-cell">
	<UncapIndicator
		type="character"
		{uncapLevel}
		{transcendenceStage}
		{flb}
		{ulb}
		{transcendence}
		{special}
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