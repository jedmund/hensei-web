<svelte:options runes={true} />

<script lang="ts">
	import PageMeta from '$lib/components/PageMeta.svelte'
	import * as m from '$lib/paraglide/messages'
	import { goto } from '$app/navigation'
	import { page } from '$app/stores'
	import { createQuery } from '@tanstack/svelte-query'
	import { entityQueries } from '$lib/api/queries/entity.queries'
	import DatabaseGridWithProvider from '$lib/components/database/DatabaseGridWithProvider.svelte'
	import SegmentedControl from '$lib/components/ui/segmented-control/SegmentedControl.svelte'
	import Segment from '$lib/components/ui/segmented-control/Segment.svelte'
	import type { IColumn } from 'wx-svelte-grid'
	import WeaponImageCell from '$lib/components/database/cells/WeaponImageCell.svelte'
	import ElementCell from '$lib/components/database/cells/ElementCell.svelte'
	import ProficiencyCell from '$lib/components/database/cells/ProficiencyCell.svelte'
	import WeaponUncapCell from '$lib/components/database/cells/WeaponUncapCell.svelte'
	import LastUpdatedCell from '$lib/components/database/cells/LastUpdatedCell.svelte'
	import { getRarityLabel } from '$lib/utils/rarity'

	// View mode state - read initial value from URL
	const initialView = $page.url.searchParams.get('view')
	let viewMode = $state<'weapons' | 'series'>(initialView === 'series' ? 'series' : 'weapons')

	// Sync viewMode changes to URL
	$effect(() => {
		const currentView = $page.url.searchParams.get('view')
		if (viewMode === 'series' && currentView !== 'series') {
			goto('?view=series', { replaceState: true, noScroll: true })
		} else if (viewMode === 'weapons' && currentView === 'series') {
			goto('/database/weapons', { replaceState: true, noScroll: true })
		}
	})

	// Query for weapon series
	const weaponSeriesQuery = createQuery(() => entityQueries.weaponSeriesList())

	// Sorted series data
	const sortedSeries = $derived.by(() => {
		if (!weaponSeriesQuery.data) return []
		return [...weaponSeriesQuery.data].sort((a, b) => a.order - b.order)
	})

	// Navigate to series detail
	function handleSeriesClick(slug: string) {
		goto(`/database/series/weapons/${slug}`)
	}

	// Column configuration for weapons
	const columns: IColumn[] = [
		{
			id: 'granblueId',
			header: '',
			width: 80,
			cell: WeaponImageCell
		},
		{
			id: 'name',
			header: 'Name',
			flexgrow: 1,
			sort: true,
			template: (nameObj: any) => {
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
			template: (rarity: any) => getRarityLabel(rarity)
		},
		{
			id: 'element',
			header: 'Element',
			width: 100,
			sort: true,
			cell: ElementCell
		},
		{
			id: 'proficiency',
			header: 'Proficiency',
			width: 100,
			sort: true,
			cell: ProficiencyCell
		},
		{
			id: 'uncap',
			header: 'Uncap',
			width: 160,
			cell: WeaponUncapCell
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

<PageMeta title={m.page_title_db_weapons()} description={m.page_desc_home()} />

<div class="database-page">
	{#if viewMode === 'weapons'}
		<DatabaseGridWithProvider resource="weapons" {columns} pageSize={20}>
			{#snippet leftActions()}
				<SegmentedControl bind:value={viewMode} size="xsmall" variant="background">
					<Segment value="weapons">Weapons</Segment>
					<Segment value="series">Series</Segment>
				</SegmentedControl>
			{/snippet}
		</DatabaseGridWithProvider>
	{:else}
		<div class="grid-container">
			<div class="controls">
				<SegmentedControl bind:value={viewMode} size="xsmall" variant="background">
					<Segment value="weapons">Weapons</Segment>
					<Segment value="series">Series</Segment>
				</SegmentedControl>
			</div>

			{#if weaponSeriesQuery.isPending}
				<div class="loading-state">Loading series...</div>
			{:else if weaponSeriesQuery.error}
				<div class="error-state">Failed to load series</div>
			{:else if sortedSeries.length > 0}
				<div class="grid-wrapper">
					<table class="series-table">
						<thead>
							<tr>
								<th class="col-order">Order</th>
								<th class="col-name">Name</th>
								<th class="col-slug">Slug</th>
								<th class="col-flags">Flags</th>
							</tr>
						</thead>
						<tbody>
							{#each sortedSeries as series (series.id)}
								<tr onclick={() => handleSeriesClick(series.slug)} class="clickable">
									<td class="col-order">{series.order}</td>
									<td class="col-name">
										<span class="series-name">{series.name.en}</span>
									</td>
									<td class="col-slug"><code>{series.slug}</code></td>
									<td class="col-flags">
										<div class="flags">
											{#if series.extra}<span class="flag extra">Extra</span>{/if}
											{#if series.elementChangeable}<span class="flag element">Element</span>{/if}
											{#if series.hasWeaponKeys}<span class="flag keys">Keys</span>{/if}
											{#if series.hasAwakening}<span class="flag awaken">Awaken</span>{/if}
											{#if series.hasAxSkills}<span class="flag ax">AX</span>{/if}
											{#if !series.extra && !series.elementChangeable && !series.hasWeaponKeys && !series.hasAwakening && !series.hasAxSkills}
												<span class="no-flags">-</span>
											{/if}
										</div>
									</td>
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
				<div class="empty-state">No weapon series found</div>
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
		border: 0.5px solid rgba(0, 0, 0, 0.18);
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
			border-bottom: 1px solid #e5e5e5;
		}

		th {
			background: #f8f9fa;
			font-weight: typography.$bold;
			color: #495057;
			font-size: typography.$font-small;
		}

		tr.clickable {
			cursor: pointer;

			&:hover {
				background: #f8f9fa;
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
				background: #f0f0f0;
				padding: 2px 6px;
				border-radius: 3px;
			}
		}

		.col-flags {
			min-width: 200px;
		}
	}

	.series-name {
		font-weight: typography.$normal;
	}

	.no-flags {
		color: #999;
	}

	.flags {
		display: flex;
		flex-wrap: wrap;
		gap: spacing.$unit-half;
	}

	.flag {
		display: inline-block;
		font-size: typography.$font-tiny;
		padding: 2px 6px;
		border-radius: 4px;
		font-weight: typography.$medium;

		&.extra {
			background: #f3e8ff;
			color: #6b21a8;
		}

		&.element {
			background: linear-gradient(to right, #fecaca, #fef08a, #bbf7d0, #bfdbfe, #e9d5ff, #fbcfe8);
			color: #374151;
		}

		&.keys {
			background: #fef3c7;
			color: #92400e;
		}

		&.awaken {
			background: #dcfce7;
			color: #166534;
		}

		&.ax {
			background: #ffe4e6;
			color: #9f1239;
		}
	}

	.grid-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: spacing.$unit;
		border-top: 1px solid #e5e5e5;
		background: #f8f9fa;

		.pagination-info {
			font-size: typography.$font-small;
			color: #6c757d;
		}
	}
</style>
