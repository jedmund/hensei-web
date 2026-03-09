
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

	// Utilities
	import { getRarityLabel } from '$lib/utils/rarity'

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
			flexgrow: 1,
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
			width: 100,
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
