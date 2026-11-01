<script lang="ts">
	// A character's uncap stars at their maximum: the detail's Uncap Level row,
	// the forms' (from their values) and the list's cell
	import UncapIndicator from '$lib/components/uncap/UncapIndicator.svelte'
	import { getCharacterMaxUncapLevel } from '$lib/utils/uncap'
	import type { Character } from '$lib/api/adapters/character.adapter'

	let { record }: { record: Pick<Character, 'special' | 'uncap'> } = $props()

	const special = $derived(record.special ?? false)
	const flb = $derived(record.uncap?.flb ?? false)
	const ulb = $derived(record.uncap?.ulb ?? false)
	const transcendence = $derived(record.uncap?.transcendence ?? false)
	const maxTranscendenceStage = $derived(
		transcendence ? (record.uncap?.maxTranscendenceStage ?? 0) : 0
	)
	const uncapLevel = $derived(
		getCharacterMaxUncapLevel({ special, uncap: { flb, ulb, transcendence } })
	)
</script>

<UncapIndicator
	type="character"
	{uncapLevel}
	transcendenceStage={maxTranscendenceStage}
	{flb}
	{ulb}
	{transcendence}
	{maxTranscendenceStage}
	{special}
	editable={false}
/>
