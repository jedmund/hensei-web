
<script lang="ts">
	import { goto } from '$app/navigation'
	import { page } from '$app/stores'
	import { createQuery } from '@tanstack/svelte-query'
	import { Grid } from 'wx-svelte-grid'
	import type { IColumn } from 'wx-svelte-grid'
	import { jobQueries } from '$lib/api/queries/job.queries'
	import PageMeta from '$lib/components/PageMeta.svelte'
	import * as m from '$lib/paraglide/messages'
	import { getAccessoryTypeName, ACCESSORY_TYPES } from '$lib/utils/jobAccessoryUtils'
	import { getRarityLabel } from '$lib/utils/rarity'
	import SegmentedControl from '$lib/components/ui/segmented-control/SegmentedControl.svelte'
	import Segment from '$lib/components/ui/segmented-control/Segment.svelte'
	import Select from '$lib/components/ui/Select.svelte'
	import DatabaseGridWithProvider from '$lib/components/database/DatabaseGridWithProvider.svelte'
	import type { JobAccessory } from '$lib/types/api/entities'

	// Job cell components
	import JobIconCell from '$lib/components/database/cells/JobIconCell.svelte'
	import JobTierCell from '$lib/components/database/cells/JobTierCell.svelte'
	import JobProficienciesCell from '$lib/components/database/cells/JobProficienciesCell.svelte'
	import JobFeaturesCell from '$lib/components/database/cells/JobFeaturesCell.svelte'

	// Accessory cell components
	import AccessoryImageCell from '$lib/components/database/cells/AccessoryImageCell.svelte'
	import AccessoryJobCell from '$lib/components/database/cells/AccessoryJobCell.svelte'
	import AccessoryNameCell from '$lib/components/database/cells/AccessoryNameCell.svelte'
	import AccessoryTypeCell from '$lib/components/database/cells/AccessoryTypeCell.svelte'

	// View mode state - read initial value from URL
	const initialView = $page.url.searchParams.get('view')
	let viewMode = $state<'jobs' | 'accessories' | 'skills'>(
		initialView === 'accessories' ? 'accessories' : 'jobs'
	)

	// Accessory type filter
	let accessoryTypeFilter = $state<number | undefined>(undefined)

	// Sync viewMode changes to URL
	$effect(() => {
		if (viewMode === 'skills') {
			goto('/database/job-skills', { replaceState: true, noScroll: true })
			return
		}
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

	// Define columns for accessories grid
	const accessoryColumns: IColumn[] = [
		{
			id: 'granblueId',
			header: '',
			width: 80,
			cell: AccessoryImageCell
		},
		{
			id: 'name',
			header: 'Name',
			flexgrow: 1,
			sort: true,
			cell: AccessoryNameCell
		},
		{
			id: 'accessoryType',
			header: 'Type',
			width: 120,
			sort: true,
			cell: AccessoryTypeCell
		},
		{
			id: 'job',
			header: 'Job',
			width: 180,
			sort: true,
			cell: AccessoryJobCell
		},
		{
			id: 'rarity',
			header: 'Rarity',
			width: 80,
			sort: true,
			template: (rarity: any) => getRarityLabel(rarity)
		}
	]

	// Accessory type select options
	const typeOptions = [
		{ value: 0, label: 'All types' },
		{ value: ACCESSORY_TYPES.SHIELD, label: 'Shield' },
		{ value: ACCESSORY_TYPES.MANATURA, label: 'Manatura' }
	]

	let selectedType = $state<number>(0)

	// Sync selectedType to accessoryTypeFilter
	$effect(() => {
		accessoryTypeFilter = selectedType === 0 ? undefined : selectedType
	})

	// Fetch all accessories
	const accessoriesQuery = createQuery(() => ({
		...jobQueries.accessoriesList(accessoryTypeFilter),
		enabled: viewMode === 'accessories'
	}))

	// Search state
	let accessorySearchTerm = $state('')

	// Filter and sort accessories
	const accessoryData = $derived.by(() => {
		const accessories = accessoriesQuery.data ?? []
		let filtered = accessories

		if (accessorySearchTerm.trim()) {
			const term = accessorySearchTerm.toLowerCase()
			filtered = accessories.filter(
				(acc) =>
					acc.name.en.toLowerCase().includes(term) ||
					acc.name.ja?.toLowerCase().includes(term) ||
					acc.granblueId.includes(term)
			)
		}

		return [...filtered].sort((a, b) => {
			if (a.accessoryType !== b.accessoryType) {
				return a.accessoryType - b.accessoryType
			}
			return a.granblueId.localeCompare(b.granblueId)
		})
	})

	// Grid API reference for accessories
	let accessoryApi: any

	const initAccessoryGrid = (apiRef: any) => {
		accessoryApi = apiRef

		apiRef.on('select-row', (ev: any) => {
			const rowId = ev.id
			if (rowId) {
				const rowData = accessoryData.find((item) => item.id === rowId)
				if (rowData) {
					goto(`/database/job-accessories/${rowData.granblueId}`)
				}
			}
		})
	}
</script>

<PageMeta title={m.page_title_db_jobs()} description={m.page_desc_home()} />

<svelte:head>
	<link rel="stylesheet" href="https://cdn.svar.dev/fonts/wxi/wx-icons.css" />
</svelte:head>

<div class="page">
	{#if viewMode === 'jobs'}
		<DatabaseGridWithProvider resource="jobs" columns={jobColumns} pageSize={20}>
			{#snippet leftActions()}
				<SegmentedControl bind:value={viewMode} size="xsmall" variant="background">
					<Segment value="jobs">Jobs</Segment>
					<Segment value="accessories">Accessories</Segment>
					<Segment value="skills">Skills</Segment>
				</SegmentedControl>
			{/snippet}
		</DatabaseGridWithProvider>
	{:else}
		<div class="grid">
			<div class="controls">
				<div class="controls-left">
					<SegmentedControl bind:value={viewMode} size="xsmall" variant="background">
						<Segment value="jobs">Jobs</Segment>
						<Segment value="accessories">Accessories</Segment>
						<Segment value="skills">Skills</Segment>
					</SegmentedControl>

					<Select
						options={typeOptions}
						bind:value={selectedType}
						placeholder="All types"
						size="small"
					/>
				</div>

				<div class="controls-right">
					<input type="text" placeholder="Search..." bind:value={accessorySearchTerm} />
				</div>
			</div>

			<div class="grid-wrapper" class:loading={accessoriesQuery.isLoading}>
				{#if accessoriesQuery.isLoading}
					<div class="loading-overlay">
						<div class="loading-spinner">Loading...</div>
					</div>
				{/if}

				<Grid
					data={accessoryData}
					columns={accessoryColumns}
					init={initAccessoryGrid}
					sizes={{ rowHeight: 60 }}
					class="database-grid-theme"
				/>
			</div>

			<div class="grid-footer">
				<div class="pagination-info">
					{#if accessoryData.length > 0}
						Showing {accessoryData.length} of {accessoriesQuery.data?.length ?? 0} accessories
					{:else}
						No accessories found
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/effects' as effects;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.page {
		padding: 0;
		margin: 0 auto;
	}

	.grid {
		width: 100%;
		background: var(--card-bg);
		border: 0.5px solid rgba(0, 0, 0, 0.18);
		border-radius: layout.$page-corner;
		box-shadow: effects.$page-elevation;
		overflow: hidden;

		.controls {
			display: flex;
			flex-wrap: wrap;
			align-items: center;
			justify-content: space-between;
			padding: spacing.$unit-2x;
			gap: spacing.$unit;

			.controls-left {
				display: flex;
				align-items: center;
				gap: spacing.$unit;
			}

			.controls-right {
				display: flex;
				align-items: center;
				gap: spacing.$unit;
				margin-left: auto;

				input {
					padding: spacing.$unit spacing.$unit-2x;
					background: var(--input-bound-bg);
					color: var(--text-primary);
					border: none;
					border-radius: layout.$item-corner;
					font-family: 'AGrot', system-ui, sans-serif;
					font-size: typography.$font-small;
					width: 200px;

					&::placeholder {
						color: var(--text-tertiary);
					}

					&:hover {
						background: var(--input-bound-bg-hover);
					}

					&:focus {
						outline: none;
						border-color: var(--accent-blue);
					}
				}
			}
		}

		.grid-wrapper {
			position: relative;
			overflow-x: auto;
			min-height: 200px;

			&.loading {
				opacity: 0.6;
			}

			.loading-overlay {
				position: absolute;
				top: 0;
				left: 0;
				right: 0;
				bottom: 0;
				background: color-mix(in srgb, var(--card-bg) 90%, transparent);
				display: flex;
				align-items: center;
				justify-content: center;
				z-index: effects.$z-sticky;

				.loading-spinner {
					font-size: typography.$font-medium;
					color: var(--text-tertiary);
				}
			}
		}

		.grid-footer {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: spacing.$unit-2x;
			border-top: 1px solid var(--border-subtle);
			background: var(--bar-bg);

			.pagination-info {
				font-size: typography.$font-small;
				color: var(--text-secondary);
			}
		}
	}

	// Grid theme styles (matching DatabaseGridWithProvider)
	:global(.database-grid-theme) {
		font-size: typography.$font-small;
		width: 100%;
		color: var(--text-primary);
	}

	:global(.wx-grid .wx-header) {
		background: var(--bar-bg);
	}

	:global(.wx-grid .wx-h-row) {
		height: auto !important;
		background: var(--bar-bg);
		padding-bottom: spacing.$unit-half;
		border-bottom: 1px solid var(--border-medium);
	}

	:global(.wx-grid .wx-h-row .wx-cell) {
		box-sizing: border-box;
		background: var(--bar-bg);
		font-weight: typography.$bold;
		color: var(--text-secondary);
		border-radius: layout.$item-corner;
		transition: background-color 0.15s ease;
		cursor: pointer;

		&:hover {
			background: var(--table-header-hover);
		}
	}

	:global(.wx-grid .wx-h-row .wx-sort) {
		height: auto;
		margin-left: spacing.$unit-half;
		flex-shrink: 0;
		align-self: center;
	}

	:global(.wx-grid .wx-cell) {
		padding: spacing.$unit * 0.5;
		vertical-align: middle;
		display: flex;
		align-items: center;
		border: none;
		color: var(--text-primary);
		--wx-table-cell-border: none;
	}

	:global(.wx-grid .wx-cell:first-child) {
		padding-left: spacing.$unit-2x;
	}

	:global(.wx-grid .wx-cell:not(:last-child)) {
		border-right: none;
	}

	:global(.wx-grid .wx-row:hover) {
		background: var(--table-row-hover);
		cursor: pointer;
	}
</style>
