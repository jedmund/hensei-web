
<script lang="ts">
	import { goto } from '$app/navigation'
	import { page } from '$app/stores'
	import { createQuery } from '@tanstack/svelte-query'
	import { jobQueries } from '$lib/api/queries/job.queries'
	import PageMeta from '$lib/components/PageMeta.svelte'
	import * as m from '$lib/paraglide/messages'
	import { getAccessoryTypeName, ACCESSORY_TYPES } from '$lib/utils/jobAccessoryUtils'
	import SegmentedControl from '$lib/components/ui/segmented-control/SegmentedControl.svelte'
	import Segment from '$lib/components/ui/segmented-control/Segment.svelte'
	import DatabaseGridWithProvider from '$lib/components/database/DatabaseGridWithProvider.svelte'
	import type { IColumn } from 'wx-svelte-grid'
	import type { JobAccessory } from '$lib/types/api/entities'

	// Job cell components
	import JobIconCell from '$lib/components/database/cells/JobIconCell.svelte'
	import JobTierCell from '$lib/components/database/cells/JobTierCell.svelte'
	import JobProficienciesCell from '$lib/components/database/cells/JobProficienciesCell.svelte'
	import JobFeaturesCell from '$lib/components/database/cells/JobFeaturesCell.svelte'

	// View mode state - read initial value from URL
	const initialView = $page.url.searchParams.get('view')
	let viewMode = $state<'jobs' | 'accessories'>(initialView === 'accessories' ? 'accessories' : 'jobs')

	// Accessory type filter (for accessories view)
	let accessoryTypeFilter = $state<number | undefined>(undefined)

	// Sync viewMode changes to URL
	$effect(() => {
		const currentView = $page.url.searchParams.get('view')
		if (viewMode === 'accessories' && currentView !== 'accessories') {
			goto('?view=accessories', { replaceState: true, noScroll: true })
		} else if (viewMode === 'jobs' && currentView === 'accessories') {
			goto('/database/jobs', { replaceState: true, noScroll: true })
		}
	})

	// Define columns for jobs grid
	const jobColumns: IColumn[] = [
		{
			id: 'granblueId',
			header: '',
			width: 60,
			cell: JobIconCell
		},
		{
			id: 'name',
			header: 'Name',
			flexgrow: 1,
			sort: true,
			template: (nameObj: any) => {
				if (!nameObj) return '—'
				if (typeof nameObj === 'string') return nameObj
				return nameObj.en || nameObj.ja || '—'
			}
		},
		{
			id: 'row',
			header: 'Row',
			width: 100,
			sort: true,
			cell: JobTierCell
		},
		{
			id: 'proficiency',
			header: 'Proficiencies',
			width: 120,
			cell: JobProficienciesCell
		},
		{
			id: 'features',
			header: 'Features',
			width: 200,
			cell: JobFeaturesCell
		}
	]

	// Fetch all accessories (for accessories view)
	const accessoriesQuery = createQuery(() => ({
		...jobQueries.accessoriesList(accessoryTypeFilter),
		enabled: viewMode === 'accessories'
	}))

	// Search state for accessories
	let accessorySearchTerm = $state('')

	// Filter accessories based on search
	const filteredAccessories = $derived.by(() => {
		const accessories = accessoriesQuery.data ?? []
		if (!accessorySearchTerm.trim()) return accessories

		const term = accessorySearchTerm.toLowerCase()
		return accessories.filter(
			(acc) =>
				acc.name.en.toLowerCase().includes(term) ||
				acc.name.ja?.toLowerCase().includes(term) ||
				acc.granblueId.includes(term)
		)
	})

	// Sort accessories by type then granblue_id
	const sortedAccessories = $derived.by(() => {
		const accessories = [...filteredAccessories]
		accessories.sort((a, b) => {
			if (a.accessoryType !== b.accessoryType) {
				return a.accessoryType - b.accessoryType
			}
			return a.granblueId.localeCompare(b.granblueId)
		})
		return accessories
	})

	function handleAccessoryRowClick(accessory: JobAccessory) {
		goto(`/database/job-accessories/${accessory.granblueId}`)
	}

	function handleAccessoryTypeChange(event: Event) {
		const select = event.target as HTMLSelectElement
		accessoryTypeFilter = select.value ? Number(select.value) : undefined
	}
</script>

<PageMeta title={m.page_title_db_jobs()} description={m.page_desc_home()} />

<div class="page">
	{#if viewMode === 'jobs'}
		<!-- Jobs View - Using DatabaseGridWithProvider -->
		<DatabaseGridWithProvider resource="jobs" columns={jobColumns} pageSize={20}>
			{#snippet leftActions()}
				<SegmentedControl bind:value={viewMode} size="xsmall" variant="background">
					<Segment value="jobs">Jobs</Segment>
					<Segment value="accessories">Accessories</Segment>
				</SegmentedControl>
			{/snippet}
		</DatabaseGridWithProvider>
	{:else}
		<!-- Accessories View - Custom table -->
		<div class="grid-container">
			<div class="controls">
				<div class="controls-left">
					<SegmentedControl bind:value={viewMode} size="xsmall" variant="background">
						<Segment value="jobs">Jobs</Segment>
						<Segment value="accessories">Accessories</Segment>
					</SegmentedControl>

					<select class="filter-select" onchange={handleAccessoryTypeChange}>
						<option value="">All types</option>
						<option value={ACCESSORY_TYPES.SHIELD}>Shield</option>
						<option value={ACCESSORY_TYPES.MANATURA}>Manatura</option>
					</select>
				</div>

				<input type="text" placeholder="Search accessories..." bind:value={accessorySearchTerm} class="search" />
			</div>

			{#if accessoriesQuery.isLoading}
				<div class="loading">Loading accessories...</div>
			{:else if accessoriesQuery.isError}
				<div class="error">Failed to load accessories</div>
			{:else if sortedAccessories.length === 0}
				<div class="empty">No accessories found</div>
			{:else}
				<div class="table-wrapper">
					<table class="data-table">
						<thead>
							<tr>
								<th class="col-name">Name</th>
								<th class="col-type">Type</th>
								<th class="col-job">Job</th>
								<th class="col-rarity">Rarity</th>
								<th class="col-id">Granblue ID</th>
							</tr>
						</thead>
						<tbody>
							{#each sortedAccessories as accessory (accessory.id)}
								<tr onclick={() => handleAccessoryRowClick(accessory)} class="clickable">
									<td class="col-name">
										<div class="name-cell">
											<span class="name-en">{accessory.name.en}</span>
											{#if accessory.name.ja}
												<span class="name-ja">{accessory.name.ja}</span>
											{/if}
										</div>
									</td>
									<td class="col-type">
										<span class="type-badge {accessory.accessoryType === ACCESSORY_TYPES.SHIELD ? 'shield' : 'manatura'}">
											{getAccessoryTypeName(accessory.accessoryType)}
										</span>
									</td>
									<td class="col-job">
										{#if accessory.job}
											{accessory.job.name.en}
										{:else}
											—
										{/if}
									</td>
									<td class="col-rarity">
										{accessory.rarity ?? '—'}
									</td>
									<td class="col-id">
										<code>{accessory.granblueId}</code>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>

				<div class="footer">
					Showing {sortedAccessories.length} of {accessoriesQuery.data?.length ?? 0} accessories
				</div>
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

	.page {
		padding: 0;
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
		justify-content: space-between;
		align-items: center;
		padding: spacing.$unit-2x;
		gap: spacing.$unit;
		flex-wrap: wrap;

		.controls-left {
			display: flex;
			align-items: center;
			gap: spacing.$unit;
		}

		.filter-select {
			padding: spacing.$unit spacing.$unit-2x;
			background: var(--input-bound-bg);
			border: none;
			border-radius: layout.$item-corner;
			font-size: typography.$font-small;
			cursor: pointer;

			&:hover {
				background: var(--input-bound-bg-hover);
			}

			&:focus {
				outline: none;
				box-shadow: 0 0 0 2px var(--blue);
			}
		}

		.search {
			padding: spacing.$unit spacing.$unit-2x;
			background: var(--input-bound-bg);
			border: none;
			border-radius: layout.$item-corner;
			font-size: typography.$font-small;
			width: 200px;

			&:hover {
				background: var(--input-bound-bg-hover);
			}

			&:focus {
				outline: none;
				box-shadow: 0 0 0 2px var(--blue);
			}
		}
	}

	.loading,
	.error,
	.empty {
		text-align: center;
		padding: spacing.$unit * 4;
		color: var(--text-secondary);
	}

	.error {
		color: var(--red);
	}

	.table-wrapper {
		overflow-x: auto;
	}

	.data-table {
		width: 100%;
		border-collapse: collapse;

		th,
		td {
			padding: spacing.$unit-2x spacing.$unit;
			text-align: left;
			border-bottom: 1px solid #dee2e6;
		}

		th {
			background: #f8f9fa;
			font-weight: typography.$bold;
			color: #495057;
			white-space: nowrap;
		}

		tbody tr {
			&.clickable {
				cursor: pointer;

				&:hover {
					background: #f8f9fa;
				}
			}
		}
	}

	.col-name {
		min-width: 180px;
	}

	.col-type {
		width: 100px;
	}

	.col-job {
		min-width: 150px;
	}

	.col-rarity {
		width: 80px;
	}

	.col-id {
		width: 120px;

		code {
			font-size: typography.$font-small;
			background: #f0f0f0;
			padding: 2px 6px;
			border-radius: 3px;
		}
	}

	.name-cell {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-fourth;

		.name-ja {
			font-size: typography.$font-small;
			color: var(--text-secondary);
		}
	}

	.type-badge {
		display: inline-block;
		padding: 2px 8px;
		border-radius: layout.$item-corner-small;
		font-size: typography.$font-small;
		font-weight: typography.$medium;

		&.shield {
			background: #e0f2fe;
			color: #0369a1;
		}

		&.manatura {
			background: #fce7f3;
			color: #be185d;
		}
	}

	.footer {
		padding: spacing.$unit;
		text-align: center;
		color: var(--text-secondary);
		font-size: typography.$font-small;
		background: #f8f9fa;
		border-top: 1px solid #e5e5e5;
	}
</style>
