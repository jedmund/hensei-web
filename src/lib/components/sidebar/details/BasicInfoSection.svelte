<script lang="ts">
	import { getRarityLabel } from '$lib/utils/rarity'
	import { getRaceLabel } from '$lib/utils/race'
	import { getGenderLabel } from '$lib/utils/gender'
	import DetailsSection from './DetailsSection.svelte'
	import DetailRow from './DetailRow.svelte'
	import UncapIndicator from '$lib/components/uncap/UncapIndicator.svelte'
	import ElementLabel from '$lib/components/labels/ElementLabel.svelte'
	import ProficiencyLabel from '$lib/components/labels/ProficiencyLabel.svelte'

	interface Props {
		type: 'character' | 'weapon' | 'summon'
		itemData: any
	}

	let { type, itemData }: Props = $props()

	// Calculate max uncap level (all stars filled)
	const maxUncapLevel = $derived.by(() => {
		const flb = itemData?.uncap?.flb ?? false
		const ulb = itemData?.uncap?.ulb ?? false
		const transcendence = itemData?.uncap?.transcendence ?? false
		const special = type === 'character' && (itemData?.rarity ?? 3) < 3

		if (type === 'character') {
			if (special) {
				return ulb ? 5 : flb ? 4 : 3
			} else {
				// Regular characters: transcendence star is separate
				return flb ? 5 : 4
			}
		} else {
			// Weapons and summons
			return transcendence ? 5 : ulb ? 5 : flb ? 4 : 3
		}
	})

	const special = $derived(type === 'character' && (itemData?.rarity ?? 3) < 3)
</script>

<DetailsSection title="Basic Information">
	<DetailRow label="Rarity" value={getRarityLabel(itemData?.rarity)} />
	<DetailRow label="Element">
		<ElementLabel element={itemData?.element} size="medium" />
	</DetailRow>

	{#if type === 'character'}
		{#if itemData?.race && itemData.race.length > 0}
			<DetailRow
				label="Race"
				value={itemData.race
					.map((r: any) => getRaceLabel(r))
					.filter(Boolean)
					.join(', ') || '—'}
			/>
		{/if}
		<DetailRow label="Gender" value={getGenderLabel(itemData?.gender)} />
		{#if itemData?.proficiency && itemData.proficiency.length > 0}
			<DetailRow label="Proficiencies">
				<span class="proficiency-list">
					{#each itemData.proficiency as prof}
						<ProficiencyLabel proficiency={prof} size="medium" />
					{/each}
				</span>
			</DetailRow>
		{/if}
	{:else if type === 'weapon'}
		<DetailRow label="Proficiency">
			<ProficiencyLabel proficiency={itemData?.proficiency} size="medium" />
		</DetailRow>
	{/if}

	<DetailRow label="Max Uncap">
		<UncapIndicator
			{type}
			uncapLevel={maxUncapLevel}
			transcendenceStage={itemData?.uncap?.transcendence ? 5 : 0}
			flb={itemData?.uncap?.flb ?? false}
			ulb={itemData?.uncap?.ulb ?? false}
			transcendence={itemData?.uncap?.transcendence ?? false}
			{special}
		/>
	</DetailRow>
</DetailsSection>

<style lang="scss">
	@use '$src/themes/spacing' as *;

	.proficiency-list {
		display: inline-flex;
		gap: $unit-half;
	}
</style>
