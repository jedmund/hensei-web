<svelte:options runes={true} />

<script lang="ts">
	import UncapIndicator from '$lib/components/uncap/UncapIndicator.svelte'

	interface Props {
		row: any
		type: 'character' | 'weapon' | 'summon'
	}

	let { row, type }: Props = $props()

	// Extract uncap data from row
	const uncapData = $derived(() => {
		// Direct properties on the row
		const uncapLevel = row.uncap_level ?? row.max_level ?? 3
		const transcendenceStage = row.transcendence_step ?? 0

		// Check for uncap object if it exists
		const uncap = row.uncap ?? {}
		const flb = uncap.flb ?? false
		const ulb = uncap.ulb ?? false
		const transcendence = uncap.transcendence ?? false

		// Special flag for characters
		const special = type === 'character' && row.special

		return {
			uncapLevel,
			transcendenceStage,
			flb,
			ulb,
			transcendence,
			special
		}
	})
</script>

<div class="uncap-cell">
	<UncapIndicator
		{type}
		uncapLevel={uncapData().uncapLevel}
		transcendenceStage={uncapData().transcendenceStage}
		flb={uncapData().flb}
		ulb={uncapData().ulb}
		transcendence={uncapData().transcendence}
		special={uncapData().special}
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