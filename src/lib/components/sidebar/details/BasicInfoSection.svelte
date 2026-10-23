<script lang="ts">
	import { getRarityLabel } from '$lib/utils/rarity'
	import { getRaceLabel } from '$lib/utils/race'
	import { getGenderLabel } from '$lib/utils/gender'
	import DetailsSection from './DetailsSection.svelte'
	import DetailRow from './DetailRow.svelte'
	import UncapIndicator from '$lib/components/uncap/UncapIndicator.svelte'
	import { normalizeCharacterUncap } from '$lib/utils/uncap'
	import ElementLabel from '$lib/components/labels/ElementLabel.svelte'
	import ProficiencyLabel from '$lib/components/labels/ProficiencyLabel.svelte'
	import { localizedName } from '$lib/utils/locale'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		type: 'character' | 'weapon' | 'summon'
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic entity data from API
		itemData: any
	}

	let { type, itemData }: Props = $props()

	// Calculate max uncap level (all stars filled)
	const maxUncapLevel = $derived.by(() => {
		const special = type === 'character' && !!itemData?.special
		const normalized =
			type === 'character'
				? normalizeCharacterUncap({ special, uncap: itemData?.uncap ?? { flb: false } })
				: null
		const flb = normalized?.flb ?? itemData?.uncap?.flb ?? false
		const ulb = normalized?.ulb ?? itemData?.uncap?.ulb ?? false
		const transcendence = normalized?.transcendence ?? itemData?.uncap?.transcendence ?? false

		if (type === 'character') {
			if (special) {
				return ulb ? 5 : flb ? 4 : 3
			} else {
				return transcendence ? 6 : flb ? 5 : 4
			}
		} else {
			// Weapons and summons
			return transcendence ? 5 : ulb ? 5 : flb ? 4 : 3
		}
	})

	const special = $derived(type === 'character' && !!itemData?.special)
	const normalizedCharacterUncap = $derived(
		type === 'character'
			? normalizeCharacterUncap({ special, uncap: itemData?.uncap ?? { flb: false } })
			: null
	)
</script>

<DetailsSection title={m.details_basic_info()}>
	{#if type === 'character' && (itemData?.styleName?.en || itemData?.styleName?.ja)}
		<DetailRow label={m.details_style()} value={localizedName(itemData.styleName)} />
	{/if}
	<DetailRow label={m.details_rarity()} value={getRarityLabel(itemData?.rarity)} />
	<DetailRow label={m.details_element()}>
		<ElementLabel element={itemData?.element} size="medium" />
	</DetailRow>

	{#if type === 'character'}
		{#if itemData?.race && itemData.race.length > 0}
			<DetailRow
				label={m.details_race()}
				value={itemData.race
					.map((r: number) => getRaceLabel(r))
					.filter(Boolean)
					.join(', ') || '—'}
			/>
		{/if}
		<DetailRow label={m.details_gender()} value={getGenderLabel(itemData?.gender)} />
		{#if itemData?.proficiency && itemData.proficiency.length > 0}
			<DetailRow label={m.details_proficiencies()}>
				<span class="proficiency-list">
					{#each itemData.proficiency as prof (prof)}
						<ProficiencyLabel proficiency={prof} size="medium" />
					{/each}
				</span>
			</DetailRow>
		{/if}
	{:else if type === 'weapon'}
		<DetailRow label={m.details_proficiency()}>
			<ProficiencyLabel proficiency={itemData?.proficiency} size="medium" />
		</DetailRow>
	{/if}

	<DetailRow label={m.details_max_uncap()}>
		<UncapIndicator
			{type}
			uncapLevel={maxUncapLevel}
			transcendenceStage={(normalizedCharacterUncap?.transcendence ??
			itemData?.uncap?.transcendence)
				? (normalizedCharacterUncap?.maxTranscendenceStage ?? 5)
				: 0}
			flb={itemData?.uncap?.flb ?? false}
			ulb={normalizedCharacterUncap?.ulb ?? itemData?.uncap?.ulb ?? false}
			transcendence={normalizedCharacterUncap?.transcendence ??
				itemData?.uncap?.transcendence ??
				false}
			maxTranscendenceStage={normalizedCharacterUncap?.maxTranscendenceStage ?? 5}
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
