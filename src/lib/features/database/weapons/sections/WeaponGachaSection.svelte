<script lang="ts">
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import MultiSelect from '$lib/components/ui/MultiSelect.svelte'
	import CharacterTypeahead from '$lib/components/ui/CharacterTypeahead.svelte'
	import { PROMOTION_NAMES } from '$lib/types/enums'
	import { localizedName } from '$lib/utils/locale'

	interface Props {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic entity shape from API
		weapon: any
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic edit data shape
		editData?: any
	}

	let { weapon, editData = $bindable() }: Props = $props()

	// Promotion options for multiselect
	const promotionOptions = Object.entries(PROMOTION_NAMES).map(([value, label]) => ({
		value: Number(value),
		label
	}))
</script>

<DetailsContainer title="Gacha">
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
			bind:query={editData.recruitQuery}
			initialCharacter={weapon.recruits
				? {
						id: weapon.recruits.id,
						label:
							localizedName(weapon.recruits.name) !== '—'
								? localizedName(weapon.recruits.name)
								: weapon.recruits.granblueId,
						granblueId: weapon.recruits.granblueId,
						element: weapon.recruits.element,
						season: weapon.recruits.season,
						series: weapon.recruits.series,
						styleSwap: weapon.recruits.styleSwap
					}
				: null}
			placeholder="Search for character..."
			contained
		/>
	</DetailItem>
</DetailsContainer>
