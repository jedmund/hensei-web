
<script lang="ts">
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import MultiSelect from '$lib/components/ui/MultiSelect.svelte'
	import CharacterTypeahead from '$lib/components/ui/CharacterTypeahead.svelte'
	import { PROMOTION_NAMES, getPromotionNames } from '$lib/types/enums'
	import AssociatedEntityLink from '$lib/components/database/AssociatedEntityLink.svelte'

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
		<DetailItem label="Promotions" sublabel="Gacha pools where this weapon appears" editable={true}>
			<MultiSelect
				size="medium"
				options={promotionOptions}
				bind:value={editData.promotions}
				placeholder="Select promotions"
				contained
			/>
		</DetailItem>
		<DetailItem label="Recruits" sublabel="Character recruited by this weapon" editable={true}>
			<CharacterTypeahead
				bind:value={editData.recruits}
				initialCharacter={weapon.recruits ? { id: weapon.recruits.id, name: weapon.recruits.name?.en || weapon.recruits.granblueId, granblueId: weapon.recruits.granblueId } : null}
				placeholder="Search for character..."
				contained
			/>
		</DetailItem>
	{:else}
		<DetailItem
			label="Promotions"
			sublabel="Gacha pools where this weapon appears"
			value={formatPromotionsDisplay(weapon.promotions)}
		/>
		<DetailItem label="Recruits" sublabel="Character recruited by this weapon">
			{#if weapon.recruits}
				<AssociatedEntityLink type="character" entity={weapon.recruits} />
			{:else}
				<span class="empty-value">—</span>
			{/if}
		</DetailItem>
	{/if}
</DetailsContainer>

