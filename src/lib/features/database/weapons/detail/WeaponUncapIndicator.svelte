<script lang="ts">
	// The weapon's uncap stars in the detail's Uncap row
	import UncapIndicator from '$lib/components/uncap/UncapIndicator.svelte'
	import type { Weapon } from '$lib/api/adapters/weapon.adapter'

	let { record }: { record: Weapon } = $props()

	const flb = $derived(record.uncap?.flb ?? false)
	const ulb = $derived(record.uncap?.ulb ?? false)
	const transcendence = $derived(record.uncap?.transcendence ?? false)
	// Weapons: 3 base stars, +1 for FLB (4), +1 for ULB (5), +1 for transcendence (6)
	const uncapLevel = $derived(transcendence ? 6 : ulb ? 5 : flb ? 4 : 3)
</script>

<UncapIndicator
	type="weapon"
	{uncapLevel}
	transcendenceStage={transcendence ? 5 : 0}
	{flb}
	{ulb}
	{transcendence}
	editable={false}
/>
