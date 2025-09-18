<svelte:options runes={true} />

<script lang="ts">
	// Svelte components
	import CharacterImageCell from '$lib/components/database/cells/CharacterImageCell.svelte'
	import CharacterUncapCell from '$lib/components/database/cells/CharacterUncapCell.svelte'
	import DatabaseGridWithProvider from '$lib/components/database/DatabaseGridWithProvider.svelte'
	import ElementCell from '$lib/components/database/cells/ElementCell.svelte'
	import LastUpdatedCell from '$lib/components/database/cells/LastUpdatedCell.svelte'

	// Utilities
	import { getRarityLabel } from '$lib/utils/rarity'

	const columns = [
		{
			id: 'granblue_id',
			header: 'Image',
			width: 80,
			cell: CharacterImageCell
		},
		{
			id: 'name',
			header: 'Name',
			flexgrow: 1,
			sort: true,
			template: (nameObj: { en: any; ja: any }) => {
				if (!nameObj) return '—'
				if (typeof nameObj === 'string') return nameObj
				// Handle {en: "...", ja: "..."} structure
				return nameObj.en || nameObj.ja || '—'
			}
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

<div class="page">
	<DatabaseGridWithProvider resource="characters" {columns} pageSize={20} />
</div>

<style lang="scss">
	@use '$src/themes/colors' as colors;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.page {
		padding: spacing.$unit-2x 0;
		max-width: 1400px;
		margin: 0 auto;
	}
</style>
