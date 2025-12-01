<svelte:options runes={true} />

<script lang="ts">
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import { getElementLabel, getElementOptions } from '$lib/utils/element'

	interface Props {
		summon: any
		editMode?: boolean
		editData?: any
	}

	let { summon, editMode = false, editData = $bindable() }: Props = $props()

	const elementOptions = getElementOptions()
</script>

<DetailsContainer title="Details">
	{#if editMode}
		<DetailItem
			label="Element"
			bind:value={editData.element}
			editable={true}
			type="select"
			options={elementOptions}
		/>
		<DetailItem
			label="Series"
			bind:value={editData.series}
			editable={true}
			type="text"
			placeholder="Series name"
		/>
	{:else}
		<DetailItem label="Element" value={getElementLabel(summon.element)} />
		{#if summon.series}
			<DetailItem label="Series" value={summon.series} />
		{/if}
	{/if}
</DetailsContainer>
