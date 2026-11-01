<script lang="ts">
	// Import form: the gacha pools
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import MultiSelect from '$lib/components/ui/MultiSelect.svelte'
	import { PROMOTION_NAMES } from '$lib/types/enums'

	interface Props {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic edit data shape
		editData: any
	}

	let { editData = $bindable() }: Props = $props()

	// Promotion options for multiselect
	const promotionOptions = Object.entries(PROMOTION_NAMES).map(([value, label]) => ({
		value: Number(value),
		label
	}))
</script>

<DetailsContainer title="Gacha">
	<DetailItem label="Promotions" sublabel="Gacha pools where this summon appears" editable={true}>
		<MultiSelect
			size="medium"
			options={promotionOptions}
			bind:value={editData.promotions}
			placeholder="Select promotions"
			contained
		/>
	</DetailItem>
</DetailsContainer>
