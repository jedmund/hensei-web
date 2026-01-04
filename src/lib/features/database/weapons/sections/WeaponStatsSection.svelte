<svelte:options runes={true} />

<script lang="ts">
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'

	interface Props {
		weapon: any
		editMode?: boolean
		editData?: any
	}

	let {
		weapon,
		editMode = false,
		editData = $bindable()
	}: Props = $props()

	const flb = $derived(editMode ? Boolean(editData.flb) : Boolean(weapon?.uncap?.flb))
	const ulb = $derived(editMode ? Boolean(editData.ulb) : Boolean(weapon?.uncap?.ulb))
	const transcendence = $derived(
		editMode ? Boolean(editData.transcendence) : Boolean(weapon?.uncap?.transcendence)
	)

	// Auto-update Max Level and Max Skill Level based on uncap status
	// No FLB: 100 / 10, FLB: 150 / 15, ULB: 200 / 20, Transcendence: 250 / 25
	$effect(() => {
		if (editMode && editData) {
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
	{:else}
		<DetailItem label="Base HP" value={weapon.hp?.minHp} />
		<DetailItem label="Max HP" value={weapon.hp?.maxHp} />
		{#if flb}
			<DetailItem label="Max HP (FLB)" value={weapon.hp?.maxHpFlb} />
		{/if}
		{#if ulb}
			<DetailItem label="Max HP (ULB)" value={weapon.hp?.maxHpUlb} />
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
	{:else}
		<DetailItem label="Base Attack" value={weapon.atk?.minAtk} />
		<DetailItem label="Max Attack" value={weapon.atk?.maxAtk} />
		{#if flb}
			<DetailItem label="Max Attack (FLB)" value={weapon.atk?.maxAtkFlb} />
		{/if}
		{#if ulb}
			<DetailItem label="Max Attack (ULB)" value={weapon.atk?.maxAtkUlb} />
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
	{:else}
		<DetailItem label="Max Level" value={weapon.maxLevel} />
		{#if weapon.maxSkillLevel}
			<DetailItem label="Max Skill Level" value={weapon.maxSkillLevel} />
		{/if}
		{#if weapon.maxAwakeningLevel}
			<DetailItem label="Max Awakening Level" value={weapon.maxAwakeningLevel} />
		{/if}
	{/if}
</DetailsContainer>
