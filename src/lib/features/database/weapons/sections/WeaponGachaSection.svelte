
<script lang="ts">
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import MultiSelect from '$lib/components/ui/MultiSelect.svelte'
	import CharacterTypeahead from '$lib/components/ui/CharacterTypeahead.svelte'
	import { PROMOTION_NAMES, getPromotionNames } from '$lib/types/enums'
	import { getCharacterImage } from '$lib/utils/images'

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
				<a href="/database/characters/{weapon.recruits.granblueId}" class="recruits-link">
					<img
						src={getCharacterImage(weapon.recruits.granblueId, 'square', '01')}
						alt={weapon.recruits.name?.en || 'Recruited character'}
						class="recruits-image"
					/>
					<span class="recruits-name">{weapon.recruits.name?.en}</span>
				</a>
			{:else}
				<span class="empty-value">—</span>
			{/if}
		</DetailItem>
	{/if}
</DetailsContainer>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.recruits-link {
		display: flex;
		align-items: center;
		gap: spacing.$unit;
		text-decoration: none;
		color: var(--text-primary);

		&:hover .recruits-image {
			transform: scale(1.05);
		}

		&:hover .recruits-name {
			color: var(--blue);
		}
	}

	.recruits-image {
		width: 32px;
		height: 32px;
		border-radius: layout.$item-corner-small;
		transition: transform 0.2s ease;
	}

	.recruits-name {
		font-size: typography.$font-regular;
		transition: color 0.2s ease;
	}
</style>
