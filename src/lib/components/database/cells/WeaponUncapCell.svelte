<script lang="ts">
	import UncapIndicator from '$lib/components/uncap/UncapIndicator.svelte'
	import type { AdminWeaponRow } from '$lib/types/api/admin'

	// A weapons list row: the uncaps the weapon has, shown at their maximum
	let { row }: { row: Pick<AdminWeaponRow, 'flb' | 'ulb' | 'transcendence'> } = $props()

	const flb = $derived(!!row.flb)
	const ulb = $derived(!!row.ulb)
	const transcendence = $derived(!!row.transcendence)

	// Weapons: 3 base + FLB + ULB + transcendence
	const uncapLevel = $derived(transcendence ? 6 : ulb ? 5 : flb ? 4 : 3)
	const transcendenceStage = $derived(transcendence ? 5 : 0)
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
	@use '$src/themes/spacing' as spacing;

	.uncap-cell {
		display: flex;
		align-items: center;
		justify-content: flex-start;
		height: 100%;
		padding: spacing.$unit-half;
	}
</style>
