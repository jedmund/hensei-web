<svelte:options runes={true} />

<script lang="ts">
	import type { WeaponSuggestions } from '$lib/api/adapters/entity.adapter'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import MultiSelect from '$lib/components/ui/MultiSelect.svelte'
	import CharacterTypeahead from '$lib/components/ui/CharacterTypeahead.svelte'
	import { PROMOTION_NAMES, getPromotionNames } from '$lib/types/enums'

	interface Props {
		weapon: any
		editMode?: boolean
		editData?: any
		// Suggestion support for batch import
		suggestions?: WeaponSuggestions
		dismissedSuggestions?: Set<string>
		onAcceptSuggestion?: (field: string, value: any) => void
		onDismissSuggestion?: (field: string) => void
	}

	let {
		weapon,
		editMode = false,
		editData = $bindable(),
		suggestions,
		dismissedSuggestions,
		onAcceptSuggestion,
		onDismissSuggestion
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

	// Format recruits for display
	function formatRecruitsDisplay(recruits: any): string {
		if (!recruits) return '—'
		if (typeof recruits === 'string') return recruits
		return recruits.name?.en || recruits.granblueId || '—'
	}

	// Check if we should show the section in view mode
	const hasGachaData = $derived.by(() => {
		if (editMode) return true
		const hasPromotions = weapon?.promotions && weapon.promotions.length > 0
		const hasRecruits = weapon?.recruits
		return hasPromotions || hasRecruits
	})
</script>

{#if hasGachaData}
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
			{#if weapon.recruits}
				<DetailItem
					label="Recruits"
					sublabel="Character recruited by this weapon"
					value={formatRecruitsDisplay(weapon.recruits)}
				/>
			{/if}
		{/if}
	</DetailsContainer>
{/if}
