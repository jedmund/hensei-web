<svelte:options runes={true} />

<script lang="ts">
	import DatabaseGridWithProvider from '$lib/components/database/DatabaseGridWithProvider.svelte'
	import type { IColumn } from 'wx-svelte-grid'
	import CharacterImageCell from '$lib/components/database/cells/CharacterImageCell.svelte'
	import ElementCell from '$lib/components/database/cells/ElementCell.svelte'
	import CharacterUncapCell from '$lib/components/database/cells/CharacterUncapCell.svelte'
	import LastUpdatedCell from '$lib/components/database/cells/LastUpdatedCell.svelte'
	import { getRarityLabel } from '$lib/utils/rarity'

	// Column configuration for characters
	const columns: IColumn[] = [
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
			template: (nameObj) => {
				// nameObj is the name property itself, not the full item
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
			template: (rarity) => getRarityLabel(rarity)
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

<div class="database-page">
	<div class="page-header">
		<h1>Characters Database</h1>
		<p class="subtitle">Browse and search all available characters</p>
	</div>

	<DatabaseGridWithProvider
		resource="characters"
		{columns}
		pageSize={20}
	/>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.database-page {
		padding: spacing.$unit * 2;
		max-width: 1400px;
		margin: 0 auto;
	}

	.page-header {
		margin-bottom: spacing.$unit * 2;

		h1 {
			font-size: typography.$font-xxlarge;
			font-weight: typography.$bold;
			margin-bottom: spacing.$unit * 0.5;
		}

		.subtitle {
			font-size: typography.$font-regular;
			color: #6c757d;
		}
	}
</style>