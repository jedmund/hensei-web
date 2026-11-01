<script lang="ts">
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'

	interface Props {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic edit data shape
		editData: any
	}

	let { editData = $bindable() }: Props = $props()

	const flb = $derived(Boolean(editData.flb))
	const ulb = $derived(Boolean(editData.ulb))
	const transcendence = $derived(Boolean(editData.transcendence))

	// Auto-update Max Level and Max Skill Level based on uncap status
	// No FLB: 100 / 10, FLB: 150 / 15, ULB: 200 / 20, Transcendence: 250 / 25
	$effect(() => {
		if (editData) {
			if (transcendence) {
				editData.maxLevel = 250
				editData.maxSkillLevel = 25
			} else if (ulb) {
				editData.maxLevel = 200
				editData.maxSkillLevel = 20
			} else if (flb) {
				editData.maxLevel = 150
				editData.maxSkillLevel = 15
			} else {
				editData.maxLevel = 100
				editData.maxSkillLevel = 10
			}
		}
	})
</script>

<DetailsContainer title="HP Stats">
	<DetailItem
		label="Base HP"
		bind:value={editData.minHp}
		editable={true}
		type="number"
		placeholder="0"
	/>
	<DetailItem
		label="Max HP"
		bind:value={editData.maxHp}
		editable={true}
		type="number"
		placeholder="0"
	/>
	{#if flb}
		<DetailItem
			label="Max HP (FLB)"
			bind:value={editData.maxHpFlb}
			editable={true}
			type="number"
			placeholder="0"
		/>
	{/if}
	{#if ulb}
		<DetailItem
			label="Max HP (ULB)"
			bind:value={editData.maxHpUlb}
			editable={true}
			type="number"
			placeholder="0"
		/>
	{/if}
</DetailsContainer>

<DetailsContainer title="Attack Stats">
	<DetailItem
		label="Base Attack"
		bind:value={editData.minAtk}
		editable={true}
		type="number"
		placeholder="0"
	/>
	<DetailItem
		label="Max Attack"
		bind:value={editData.maxAtk}
		editable={true}
		type="number"
		placeholder="0"
	/>
	{#if flb}
		<DetailItem
			label="Max Attack (FLB)"
			bind:value={editData.maxAtkFlb}
			editable={true}
			type="number"
			placeholder="0"
		/>
	{/if}
	{#if ulb}
		<DetailItem
			label="Max Attack (ULB)"
			bind:value={editData.maxAtkUlb}
			editable={true}
			type="number"
			placeholder="0"
		/>
	{/if}
</DetailsContainer>

<DetailsContainer title="Caps">
	<DetailItem
		label="Max Level"
		bind:value={editData.maxLevel}
		editable={true}
		type="number"
		placeholder="100"
	/>
	<DetailItem
		label="Max Skill Level"
		bind:value={editData.maxSkillLevel}
		editable={true}
		type="number"
		placeholder="10"
	/>
	<DetailItem
		label="Max Awakening Level"
		bind:value={editData.maxAwakeningLevel}
		editable={true}
		type="number"
		placeholder="0"
	/>
	<DetailItem
		label="Max Exorcism Level"
		sublabel="For befoulment weapons only"
		bind:value={editData.maxExorcismLevel}
		editable={true}
		type="number"
		placeholder="—"
		min={1}
	/>
</DetailsContainer>
