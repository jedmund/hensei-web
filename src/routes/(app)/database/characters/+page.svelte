
<script lang="ts">
	import PageMeta from '$lib/components/PageMeta.svelte'
	import * as m from '$lib/paraglide/messages'
	import { goto } from '$app/navigation'
	import { page } from '$app/stores'
	import { createQuery } from '@tanstack/svelte-query'
	import { entityQueries } from '$lib/api/queries/entity.queries'

	// Svelte components
	import CharacterImageCell from '$lib/components/database/cells/CharacterImageCell.svelte'
	import CharacterNameCell from '$lib/components/database/cells/CharacterNameCell.svelte'
	import CharacterUncapCell from '$lib/components/database/cells/CharacterUncapCell.svelte'
	import DatabaseGridWithProvider from '$lib/components/database/DatabaseGridWithProvider.svelte'
	import ElementCell from '$lib/components/database/cells/ElementCell.svelte'
	import LastUpdatedCell from '$lib/components/database/cells/LastUpdatedCell.svelte'
	import BooleanCell from '$lib/components/database/cells/BooleanCell.svelte'
	import DateCell from '$lib/components/database/cells/DateCell.svelte'
	import SegmentedControl from '$lib/components/ui/segmented-control/SegmentedControl.svelte'
	import Segment from '$lib/components/ui/segmented-control/Segment.svelte'

	// Utilities
	import { getRarityLabel } from '$lib/utils/rarity'
	import { getGenderLabel } from '$lib/utils/gender'
	import { getSeasonName } from '$lib/types/enums'
	import { localizedName } from '$lib/utils/locale'

	type ViewMode = 'characters' | 'series'

	// View mode state - read initial value from URL
	const initialView = $page.url.searchParams.get('view') as ViewMode | null
	let viewMode = $state<ViewMode>(initialView === 'series' ? 'series' : 'characters')

	// Sync viewMode changes to URL
	$effect(() => {
		const currentView = $page.url.searchParams.get('view')
		if (viewMode !== 'characters' && currentView !== viewMode) {
			goto(`?view=${viewMode}`, { replaceState: true, noScroll: true })
		} else if (viewMode === 'characters' && currentView) {
			goto('/database/characters', { replaceState: true, noScroll: true })
		}
	})

	// Query for character series
	const characterSeriesQuery = createQuery(() => entityQueries.characterSeriesList())

	// Sorted series data
	const sortedSeries = $derived.by(() => {
		if (!characterSeriesQuery.data) return []
		return [...characterSeriesQuery.data].sort((a, b) => a.order - b.order)
	})

	// Navigate to series detail
	function handleSeriesClick(slug: string) {
		goto(`/database/series/characters/${slug}`)
	}

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

<div class="database-page">
	{#if viewMode === 'characters'}
		<DatabaseGridWithProvider resource="characters" {columns} pageSize={20}>
			{#snippet leftActions()}
				<SegmentedControl bind:value={viewMode} size="xsmall" variant="background">
					<Segment value="characters">Characters</Segment>
					<Segment value="series">Series</Segment>
				</SegmentedControl>
			{/snippet}
		</DatabaseGridWithProvider>
	{:else if viewMode === 'series'}
		<div class="grid-container">
			<div class="controls">
				<SegmentedControl bind:value={viewMode} size="xsmall" variant="background">
					<Segment value="characters">Characters</Segment>
					<Segment value="series">Series</Segment>
				</SegmentedControl>
			</div>

			{#if characterSeriesQuery.isPending}
				<div class="loading-state">Loading series...</div>
			{:else if characterSeriesQuery.error}
				<div class="error-state">Failed to load series</div>
			{:else if sortedSeries.length > 0}
				<div class="grid-wrapper">
					<table class="series-table">
						<thead>
							<tr>
								<th class="col-order">Order</th>
								<th class="col-name">Name</th>
								<th class="col-slug">Slug</th>
							</tr>
						</thead>
						<tbody>
							{#each sortedSeries as series (series.id)}
								<tr onclick={() => handleSeriesClick(series.slug)} class="clickable">
									<td class="col-order">{series.order}</td>
									<td class="col-name">
										<span class="series-name">{localizedName(series.name)}</span>
									</td>
									<td class="col-slug"><code>{series.slug}</code></td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>

				<div class="grid-footer">
					<div class="pagination-info">
						{sortedSeries.length} series
					</div>
				</div>
			{:else}
				<div class="empty-state">No character series found</div>
			{/if}
		</div>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/colors' as colors;
	@use '$src/themes/effects' as effects;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.database-page {
		margin: 0 auto;
	}

	.grid-container {
		background: var(--card-bg);
		border: 0.5px solid var(--border-subtle);
		border-radius: layout.$page-corner;
		box-shadow: effects.$page-elevation;
		overflow: hidden;
	}

	.controls {
		display: flex;
		align-items: center;
		padding: spacing.$unit-2x;
		gap: spacing.$unit;
	}

	.loading-state,
	.error-state,
	.empty-state {
		padding: spacing.$unit-4x;
		text-align: center;
		color: var(--text-secondary);
	}

	.error-state {
		color: var(--text-error, #ef4444);
	}

	.grid-wrapper {
		overflow-x: auto;
		min-height: 200px;
	}

	.series-table {
		width: 100%;
		border-collapse: collapse;

		th,
		td {
			padding: spacing.$unit-2x spacing.$unit-2x;
			text-align: left;
			color: var(--text-primary);
		}

		th {
			background: var(--bar-bg);
			font-weight: typography.$bold;
			color: var(--text-secondary);
			font-size: typography.$font-small;
			border-bottom: 1px solid var(--border-medium);
		}

		tr.clickable {
			cursor: pointer;

			&:hover {
				background: var(--table-row-hover);
			}
		}

		.col-order {
			width: 80px;
			text-align: center;
		}

		.col-name {
			min-width: 200px;
		}

		.col-slug {
			min-width: 150px;

			code {
				font-size: typography.$font-small;
				background: var(--bar-bg);
				padding: 2px 6px;
				border-radius: 3px;
			}
		}
	}

	.series-name {
		font-weight: typography.$normal;
	}

	.grid-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: spacing.$unit;
		border-top: 1px solid var(--border-subtle);
		background: var(--bar-bg);

		.pagination-info {
			font-size: typography.$font-small;
			color: var(--text-secondary);
		}
	}
</style>
