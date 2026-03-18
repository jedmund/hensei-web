
<script lang="ts">
	import PageMeta from '$lib/components/PageMeta.svelte'
	import * as m from '$lib/paraglide/messages'

	// Svelte components
	import CharacterImageCell from '$lib/components/database/cells/CharacterImageCell.svelte'
	import CharacterNameCell from '$lib/components/database/cells/CharacterNameCell.svelte'
	import CharacterUncapCell from '$lib/components/database/cells/CharacterUncapCell.svelte'
	import DatabaseGridWithProvider from '$lib/components/database/DatabaseGridWithProvider.svelte'
	import ElementCell from '$lib/components/database/cells/ElementCell.svelte'
	import LastUpdatedCell from '$lib/components/database/cells/LastUpdatedCell.svelte'
	import BooleanCell from '$lib/components/database/cells/BooleanCell.svelte'
	import DateCell from '$lib/components/database/cells/DateCell.svelte'

	// Utilities
	import { getRarityLabel } from '$lib/utils/rarity'
	import { getGenderLabel } from '$lib/utils/gender'
	import { getSeasonName } from '$lib/types/enums'

	const columns = [
		{
			id: 'granblueId',
			header: '',
			width: 80,
			cell: CharacterImageCell
		},
		{
			id: 'name',
			header: 'Name',
			width: 180,
			sort: true,
			cell: CharacterNameCell
		},
		{
			id: 'rarity',
			header: 'Rarity',
			width: 80,
			sort: true,
			template: (rarity: number) => getRarityLabel(rarity)
		},
		{
			id: 'element',
			header: 'Element',
			width: 56,
			sort: true,
			cell: ElementCell
		},
		{
			id: 'uncap',
			header: 'Uncap',
			width: 160,
			cell: CharacterUncapCell
		},
		{
			id: 'last_updated',
			header: 'Last Updated',
			width: 120,
			sort: true,
			cell: LastUpdatedCell
		},
		{
			id: 'flb',
			header: 'FLB',
			width: 70,
			hidden: true,
			cell: BooleanCell,
			getter: (row: any) => row.uncap?.flb
		},
		{
			id: 'transcendence',
			header: 'Transcendence',
			width: 70,
			hidden: true,
			cell: BooleanCell,
			getter: (row: any) => row.uncap?.transcendence
		},
		{
			id: 'maxLevel',
			header: 'Max Level',
			width: 90,
			hidden: true
		},
		{
			id: 'maxAwakeningLevel',
			header: 'Max Awaken Lv',
			width: 110,
			hidden: true
		},
		{
			id: 'gender',
			header: 'Gender',
			width: 80,
			hidden: true,
			template: (val: number) => getGenderLabel(val)
		},
		{
			id: 'special',
			header: 'Special',
			width: 70,
			hidden: true,
			cell: BooleanCell
		},
		{
			id: 'season',
			header: 'Season',
			width: 100,
			hidden: true,
			template: (val: number | null) => getSeasonName(val) ?? '—'
		},
		{
			id: 'styleSwap',
			header: 'Style Swap',
			width: 90,
			hidden: true,
			cell: BooleanCell
		},
		{
			id: 'releaseDate',
			header: 'Release Date',
			width: 110,
			hidden: true,
			cell: DateCell
		},
		{
			id: 'flbDate',
			header: 'FLB Date',
			width: 110,
			hidden: true,
			cell: DateCell
		},
		{
			id: 'transcendenceDate',
			header: 'Transcendence Date',
			width: 110,
			hidden: true,
			cell: DateCell
		}
	]
</script>

<PageMeta title={m.page_title_db_characters()} description={m.page_desc_home()} />

<div class="page">
	<DatabaseGridWithProvider resource="characters" {columns} pageSize={20} />
</div>

<style lang="scss">
	@use '$src/themes/colors' as colors;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.page {
		padding: 0;
		margin: 0 auto;
	}
</style>
