<script lang="ts">
	import type { Cell } from 'wx-svelte-grid'
	import UncapIndicator from '$lib/components/uncap/UncapIndicator.svelte'
	import { getCharacterMaxUncapLevel, normalizeCharacterUncap } from '$lib/utils/uncap'

	let { row }: Cell = $props()

	// For database view, show maximum possible uncap level
	// Not the user's current uncap level
	const special = $derived(row.special ?? false)
	const uncap = $derived(normalizeCharacterUncap({ special, uncap: row.uncap ?? { flb: false } }))
	const flb = $derived(uncap.flb ?? false)
	const ulb = $derived(uncap.ulb ?? false)
	const transcendence = $derived(uncap.transcendence ?? false)
	const maxTranscendenceStage = $derived(uncap.maxTranscendenceStage ?? 0)
	const uncapLevel = $derived(getCharacterMaxUncapLevel({ special, uncap }))
	const transcendenceStage = $derived(transcendence ? maxTranscendenceStage : 0)
</script>

<div class="uncap-cell">
	<UncapIndicator
		type="character"
		{uncapLevel}
		{transcendenceStage}
		{flb}
		{ulb}
		{transcendence}
		{maxTranscendenceStage}
		{special}
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
