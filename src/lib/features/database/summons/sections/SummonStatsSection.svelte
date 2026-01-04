<svelte:options runes={true} />

<script lang="ts">
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'

	interface Props {
		summon: any
		editMode?: boolean
		editData?: any
	}

	let {
		summon,
		editMode = false,
		editData = $bindable()
	}: Props = $props()

	const flb = $derived(editMode ? Boolean(editData.flb) : Boolean(summon?.uncap?.flb))
	const ulb = $derived(editMode ? Boolean(editData.ulb) : Boolean(summon?.uncap?.ulb))
	const transcendence = $derived(
		editMode ? Boolean(editData.transcendence) : Boolean(summon?.uncap?.transcendence)
	)

	// Auto-update Max Level based on uncap status
	// No FLB: 100, FLB: 150, ULB: 200, Transcendence: 250
	$effect(() => {
		if (editMode && editData) {
			if (transcendence) {
				editData.maxLevel = 250
			} else if (ulb) {
				editData.maxLevel = 200
			} else if (flb) {
				editData.maxLevel = 150
			} else {
				editData.maxLevel = 100
			}
		}
	})
</script>

<DetailsContainer title="HP Stats">
	{#if editMode}
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
	{:else}
		<DetailItem label="Base HP" value={summon.hp?.minHp} />
		<DetailItem label="Max HP" value={summon.hp?.maxHp} />
		{#if flb}
			<DetailItem label="Max HP (FLB)" value={summon.hp?.maxHpFlb} />
		{/if}
		{#if ulb}
			<DetailItem label="Max HP (ULB)" value={summon.hp?.maxHpUlb} />
		{/if}
		{#if transcendence}
			<DetailItem label="Max HP (Transcendence)" value={summon.hp?.maxHpXlb} />
		{/if}
	{/if}
</DetailsContainer>

<DetailsContainer title="Attack Stats">
	{#if editMode}
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
	{:else}
		<DetailItem label="Base Attack" value={summon.atk?.minAtk} />
		<DetailItem label="Max Attack" value={summon.atk?.maxAtk} />
		{#if flb}
			<DetailItem label="Max Attack (FLB)" value={summon.atk?.maxAtkFlb} />
		{/if}
		{#if ulb}
			<DetailItem label="Max Attack (ULB)" value={summon.atk?.maxAtkUlb} />
		{/if}
		{#if transcendence}
			<DetailItem label="Max Attack (Transcendence)" value={summon.atk?.maxAtkXlb} />
		{/if}
	{/if}
</DetailsContainer>

<DetailsContainer title="Caps">
	{#if editMode}
		<DetailItem
			label="Max Level"
			bind:value={editData.maxLevel}
			editable={true}
			type="number"
			placeholder="100"
		/>
	{:else}
		<DetailItem label="Max Level" value={summon.maxLevel} />
	{/if}
</DetailsContainer>
