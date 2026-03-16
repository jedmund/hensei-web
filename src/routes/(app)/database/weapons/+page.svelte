
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
	import Button from '$lib/components/ui/Button.svelte'
	import type { IColumn } from 'wx-svelte-grid'
	import WeaponImageCell from '$lib/components/database/cells/WeaponImageCell.svelte'
	import ElementCell from '$lib/components/database/cells/ElementCell.svelte'
	import ProficiencyCell from '$lib/components/database/cells/ProficiencyCell.svelte'
	import WeaponUncapCell from '$lib/components/database/cells/WeaponUncapCell.svelte'
	import LastUpdatedCell from '$lib/components/database/cells/LastUpdatedCell.svelte'
	import BooleanCell from '$lib/components/database/cells/BooleanCell.svelte'
	import BaseWeaponCell from '$lib/components/database/cells/BaseWeaponCell.svelte'
	import RecruitsCell from '$lib/components/database/cells/RecruitsCell.svelte'
	import DateCell from '$lib/components/database/cells/DateCell.svelte'
	import AwakeningModal from '$lib/features/database/weapons/AwakeningModal.svelte'
	import { getRarityLabel } from '$lib/utils/rarity'
	import { getBasePath } from '$lib/utils/images'
	import { localizedName } from '$lib/utils/locale'
	import type { Awakening } from '$lib/types/api/entities'

	const extraPrerequisiteLabels: Record<number, string> = {
		3: 'MLB',
		4: 'FLB',
		5: 'ULB',
		6: 'Transcendence'
	}

	type ViewMode = 'weapons' | 'series' | 'awakenings'

	// View mode state - read initial value from URL
	const initialView = $page.url.searchParams.get('view') as ViewMode | null
	let viewMode = $state<ViewMode>(
		initialView === 'series' ? 'series' : initialView === 'awakenings' ? 'awakenings' : 'weapons'
	)

	// Sync viewMode changes to URL
	$effect(() => {
		const currentView = $page.url.searchParams.get('view')
		if (viewMode !== 'weapons' && currentView !== viewMode) {
			goto(`?view=${viewMode}`, { replaceState: true, noScroll: true })
		} else if (viewMode === 'weapons' && currentView) {
			goto('/database/weapons', { replaceState: true, noScroll: true })
		}
	})

	// Query for weapon series
	const weaponSeriesQuery = createQuery(() => entityQueries.weaponSeriesList())

	// Query for awakenings (weapon type)
	const awakeningsQuery = createQuery(() => entityQueries.awakenings('Weapon'))

	// Sorted series data
	const sortedSeries = $derived.by(() => {
		if (!weaponSeriesQuery.data) return []
		return [...weaponSeriesQuery.data].sort((a, b) => a.order - b.order)
	})

	// Sorted awakenings
	const sortedAwakenings = $derived.by(() => {
		if (!awakeningsQuery.data) return []
		return [...awakeningsQuery.data].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
	})

	// Navigate to series detail
	function handleSeriesClick(slug: string) {
		goto(`/database/series/weapons/${slug}`)
	}

	// Awakening modal state
	let awakeningModalOpen = $state(false)
	let editingAwakening = $state<Awakening | null>(null)

	function handleAddAwakening() {
		editingAwakening = null
		awakeningModalOpen = true
	}

	function handleEditAwakening(awakening: Awakening) {
		editingAwakening = awakening
		awakeningModalOpen = true
	}

	function getAwakeningImageUrl(slug: string): string {
		const ext = slug.startsWith('character-') ? 'jpg' : 'png'
		return `${getBasePath()}/awakening/${slug}.${ext}`
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
			width: 180,
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
			width: 56,
			sort: true,
			cell: ElementCell
		},
		{
			id: 'proficiency',
			header: 'Prof.',
			width: 56,
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
			flexgrow: 1,
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
			id: 'ulb',
			header: 'ULB',
			width: 70,
			hidden: true,
			cell: BooleanCell,
			getter: (row: any) => row.uncap?.ulb
		},
		{
			id: 'transcendence',
			header: 'Transcendence',
			width: 120,
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
			id: 'maxSkillLevel',
			header: 'Max Skill Lv',
			width: 100,
			hidden: true
		},
		{
			id: 'maxAwakeningLevel',
			header: 'Max Awaken Lv',
			width: 110,
			hidden: true
		},
		{
			id: 'maxExorcismLevel',
			header: 'Max Exorcism Lv',
			width: 120,
			hidden: true
		},
		{
			id: 'ax',
			header: 'AX',
			width: 60,
			hidden: true,
			cell: BooleanCell
		},
		{
			id: 'axType',
			header: 'AX Type',
			width: 80,
			hidden: true
		},
		{
			id: 'gacha',
			header: 'Gacha',
			width: 70,
			hidden: true,
			cell: BooleanCell
		},
		{
			id: 'extra',
			header: 'Extra',
			width: 70,
			hidden: true,
			cell: BooleanCell,
			yesClass: 'extra'
		},
		{
			id: 'extraPrerequisite',
			header: 'Extra Prereq.',
			width: 110,
			hidden: true,
			getter: (row: any) => row.uncap?.extraPrerequisite,
			template: (value: any) => {
				if (value == null) return '—'
				return extraPrerequisiteLabels[value as number] ?? '—'
			}
		},
		{
			id: 'limit',
			header: 'Limit',
			width: 70,
			hidden: true,
			cell: BooleanCell
		},
		{
			id: 'forgeOrder',
			header: 'Forge Order',
			width: 100,
			hidden: true
		},
		{
			id: 'forgedFrom',
			header: 'Base Weapon',
			width: 200,
			hidden: true,
			cell: BaseWeaponCell
		},
		{
			id: 'recruits',
			header: 'Recruits',
			width: 200,
			hidden: true,
			cell: RecruitsCell
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
			id: 'ulbDate',
			header: 'ULB Date',
			width: 110,
			hidden: true,
			cell: DateCell
		},
		{
			id: 'transcendenceDate',
			header: 'Transcend Date',
			width: 110,
			hidden: true,
			cell: DateCell
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
					<Segment value="awakenings">Awakenings</Segment>
				</SegmentedControl>
			{/snippet}
		</DatabaseGridWithProvider>
	{:else if viewMode === 'series'}
		<div class="grid-container">
			<div class="controls">
				<SegmentedControl bind:value={viewMode} size="xsmall" variant="background">
					<Segment value="weapons">Weapons</Segment>
					<Segment value="series">Series</Segment>
					<Segment value="awakenings">Awakenings</Segment>
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
										<span class="series-name">{localizedName(series.name)}</span>
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
	{:else}
		<!-- Awakenings view -->
		<div class="grid-container">
			<div class="controls">
				<SegmentedControl bind:value={viewMode} size="xsmall" variant="background">
					<Segment value="weapons">Weapons</Segment>
					<Segment value="series">Series</Segment>
					<Segment value="awakenings">Awakenings</Segment>
				</SegmentedControl>
				<div class="controls-right">
					<Button variant="primary" size="small" onclick={handleAddAwakening}>Add</Button>
				</div>
			</div>

			{#if awakeningsQuery.isPending}
				<div class="loading-state">Loading awakenings...</div>
			{:else if awakeningsQuery.error}
				<div class="error-state">Failed to load awakenings</div>
			{:else if sortedAwakenings.length > 0}
				<div class="grid-wrapper">
					<table class="series-table">
						<thead>
							<tr>
								<th class="col-image">Image</th>
								<th class="col-order">Order</th>
								<th class="col-name">Name</th>
								<th class="col-slug">Slug</th>
								<th class="col-type">Type</th>
							</tr>
						</thead>
						<tbody>
							{#each sortedAwakenings as awakening (awakening.id)}
								<tr onclick={() => handleEditAwakening(awakening)} class="clickable">
									<td class="col-image">
										{#if awakening.slug}
											<img
												src={getAwakeningImageUrl(awakening.slug)}
												alt={localizedName(awakening.name)}
												class="awakening-icon"
											/>
										{:else}
											<span class="no-image">—</span>
										{/if}
									</td>
									<td class="col-order">{awakening.order ?? '—'}</td>
									<td class="col-name">{localizedName(awakening.name)}</td>
									<td class="col-slug"><code>{awakening.slug}</code></td>
									<td class="col-type">{awakening.objectType ?? '—'}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>

				<div class="grid-footer">
					<div class="pagination-info">
						{sortedAwakenings.length} awakenings
					</div>
				</div>
			{:else}
				<div class="empty-state">No awakenings found</div>
			{/if}
		</div>

		<AwakeningModal bind:open={awakeningModalOpen} awakening={editingAwakening} />
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

	.controls-right {
		margin-left: auto;
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

		.col-flags {
			min-width: 200px;
		}

		.col-image {
			width: 60px;
			text-align: center;
		}

		.col-type {
			width: 100px;
		}
	}

	.awakening-icon {
		width: 28px;
		height: 28px;
		object-fit: contain;
	}

	.no-image {
		color: var(--text-secondary);
	}

	.series-name {
		font-weight: typography.$normal;
	}

	.no-flags {
		color: var(--text-secondary);
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
		border-radius: layout.$item-corner-small;
		font-weight: typography.$medium;

		&.extra {
			background: var(--badge-extra-bg);
			color: var(--badge-extra-text);
		}

		&.element {
			background: var(--badge-element-bg);
			color: var(--badge-element-text);
		}

		&.keys {
			background: var(--badge-keys-bg);
			color: var(--badge-keys-text);
		}

		&.awaken {
			background: var(--badge-awaken-bg);
			color: var(--badge-awaken-text);
		}

		&.ax {
			background: var(--badge-ax-bg);
			color: var(--badge-ax-text);
		}
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
