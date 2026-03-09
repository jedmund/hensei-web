<!--
  DORMANT COMPONENT — Currently unused.
  Origin: Was used by the character detail/edit pages to show gacha availability and promotion info.
  Removed from active use during a later refactor of the character detail page.
  May be useful if gacha info editing is re-added to character detail pages.
-->

<script lang="ts">
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import MultiSelect from '$lib/components/ui/MultiSelect.svelte'
	import { PROMOTION_NAMES, getPromotionNames } from '$lib/types/enums'
	import { getElementLabel } from '$lib/utils/element'

	type ElementName = 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'

	interface Props {
		character: any
		editMode?: boolean
		editData?: any
	}

	let { character, editMode = false, editData = $bindable() }: Props = $props()

	// Promotion options for multiselect
	const promotionOptions = Object.entries(PROMOTION_NAMES).map(([value, label]) => ({
		value: Number(value),
		label
	}))

	// Get element name for checkbox theming
	const elementName = $derived.by((): ElementName | undefined => {
		const el = editMode ? editData?.element : character?.element
		const label = getElementLabel(el)
		return label !== '—' && label !== 'Null' ? (label.toLowerCase() as ElementName) : undefined
	})

	// Format promotions for display
	function formatPromotionsDisplay(promotions: number[]): string {
		if (!promotions || promotions.length === 0) return '—'
		return getPromotionNames(promotions).join(', ')
	}

	// Check if we should show the section in view mode
	const hasGachaData = $derived.by(() => {
		if (editMode) return true
		const hasGachaAvailable = character?.gachaAvailable
		const hasPromotions = character?.promotions && character.promotions.length > 0
		return hasGachaAvailable || hasPromotions
	})
</script>

{#if hasGachaData}
	<DetailsContainer title="Gacha">
		{#if editMode}
			<DetailItem
				label="Gacha Available"
				sublabel="Can be pulled from gacha"
				bind:value={editData.gacha_available}
				editable={true}
				type="checkbox"
				element={elementName}
			/>
			<DetailItem label="Promotions" sublabel="Gacha pools where this character appears" editable={true}>
				<MultiSelect
					size="medium"
					options={promotionOptions}
					bind:value={editData.promotions}
					placeholder="Select promotions"
					contained
				/>
			</DetailItem>
		{:else}
			<DetailItem label="Gacha Available" value={character.gachaAvailable ? 'Yes' : 'No'} />
			<DetailItem
				label="Promotions"
				sublabel="Gacha pools where this character appears"
				value={formatPromotionsDisplay(character.promotions)}
			/>
		{/if}
	</DetailsContainer>
{/if}
