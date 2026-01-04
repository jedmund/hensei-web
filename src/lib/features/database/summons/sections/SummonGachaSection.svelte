<svelte:options runes={true} />

<script lang="ts">
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import MultiSelect from '$lib/components/ui/MultiSelect.svelte'
	import { PROMOTION_NAMES, getPromotionNames } from '$lib/types/enums'

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

	// Promotion options for multiselect
	const promotionOptions = Object.entries(PROMOTION_NAMES).map(([value, label]) => ({
		value: Number(value),
		label
	}))

	// Format promotions for display
	function formatPromotionsDisplay(promotions: number[]): string {
		if (!promotions || promotions.length === 0) return '—'
		return getPromotionNames(promotions).join(', ')
	}
</script>

<DetailsContainer title="Gacha">
	{#if editMode}
		<DetailItem label="Promotions" sublabel="Gacha pools where this summon appears" editable={true}>
			<MultiSelect
				size="medium"
				options={promotionOptions}
				bind:value={editData.promotions}
				placeholder="Select promotions"
				contained
			/>
		</DetailItem>
	{:else}
		<DetailItem
			label="Promotions"
			sublabel="Gacha pools where this summon appears"
			value={formatPromotionsDisplay(summon.promotions)}
		/>
	{/if}
</DetailsContainer>
