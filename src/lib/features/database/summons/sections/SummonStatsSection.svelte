<script lang="ts">
	// Import form: HP, attack and the max level
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import { standardMaxLevel } from '$lib/features/database/uncapRules'

	interface Props {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic edit data shape
		editData: any
	}

	let { editData = $bindable() }: Props = $props()

	const flb = $derived(Boolean(editData.flb))
	const ulb = $derived(Boolean(editData.ulb))
	const transcendence = $derived(Boolean(editData.transcendence))

	// The standard max level follows the rarity and uncaps
	$effect(() => {
		editData.maxLevel = standardMaxLevel(editData)
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
	{#if transcendence}
		<DetailItem
			label="Max HP (Transcendence)"
			bind:value={editData.maxHpTranscendence}
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
	{#if transcendence}
		<DetailItem
			label="Max Attack (Transcendence)"
			bind:value={editData.maxAtkTranscendence}
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
</DetailsContainer>
