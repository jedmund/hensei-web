<script lang="ts">
	// Edit form: name, rarity and Granblue ID
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import { getRarityOptions } from '$lib/utils/rarity'

	interface Props {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic edit data shape
		editData: any
	}

	let { editData = $bindable() }: Props = $props()

	const rarityOptions = getRarityOptions()
</script>

<DetailsContainer title="Metadata">
	<DetailItem
		label="Name (EN)"
		bind:value={editData.name}
		editable={true}
		type="text"
		placeholder="English name"
	/>
	<DetailItem
		label="Name (JP)"
		bind:value={editData.nameJp}
		editable={true}
		type="text"
		placeholder="日本語名"
	/>
	<DetailItem
		label="Rarity"
		bind:value={editData.rarity}
		editable={true}
		type="select"
		options={rarityOptions}
	/>
	<DetailItem label="Granblue ID" bind:value={editData.granblue_id} editable={true} type="text" />
</DetailsContainer>
