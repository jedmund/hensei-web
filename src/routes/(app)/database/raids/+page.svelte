
<script lang="ts">
	import PageMeta from '$lib/components/PageMeta.svelte'
	import * as m from '$lib/paraglide/messages'
	import { goto } from '$app/navigation'
	import { page } from '$app/stores'
	import { onMount } from 'svelte'
	import { createQuery } from '@tanstack/svelte-query'
	import { Grid } from 'wx-svelte-grid'
	import type { IColumn } from 'wx-svelte-grid'
	import { raidAdapter } from '$lib/api/adapters/raid.adapter'
	import MultiSelect from '$lib/components/ui/MultiSelect.svelte'
	import Select from '$lib/components/ui/Select.svelte'
	import SegmentedControl from '$lib/components/ui/segmented-control/SegmentedControl.svelte'
	import Segment from '$lib/components/ui/segmented-control/Segment.svelte'
	import RaidGridImageCell from '$lib/components/database/cells/RaidGridImageCell.svelte'
	import RaidNameCell from '$lib/components/database/cells/RaidNameCell.svelte'
	import RaidGroupNameCell from '$lib/components/database/cells/RaidGroupNameCell.svelte'
	import RaidGroupFlagsCell from '$lib/components/database/cells/RaidGroupFlagsCell.svelte'
	import ElementCell from '$lib/components/database/cells/ElementCell.svelte'
	import type { Raid } from '$lib/types/api/entities'
	import type { RaidGroupFull } from '$lib/types/api/raid'
	import { getRaidSectionLabel } from '$lib/utils/raidSection'

	function displayName(input: any): string {
		if (!input) return '—'
		const maybe = input.name ?? input
		if (typeof maybe === 'string') return maybe
		if (maybe && typeof maybe === 'object') return maybe.en || maybe.ja || '—'
		return '—'
	}

	// State
	let viewMode = $state<'raids' | 'groups'>('raids')
	let searchTerm = $state('')
	let elementFilters = $state<number[]>([])
	let groupFilter = $state<string | undefined>(undefined)
	let hlFilter = $state<number | undefined>(undefined)
	let extraFilter = $state<number | undefined>(undefined)

	// Read initial view mode from URL
	onMount(() => {
		const viewParam = $page.url.searchParams.get('view')
		if (viewParam === 'groups') {
			viewMode = 'groups'
		}
	})

	// Update URL when view mode changes
	function updateViewUrl(mode: 'raids' | 'groups') {
		const url = new URL($page.url)
		if (mode === 'groups') {
			url.searchParams.set('view', 'groups')
		} else {
			url.searchParams.delete('view')
		}
		goto(url.pathname + url.search, { replaceState: true, noScroll: true, keepFocus: true })
	}

	// Handle view mode change from segmented control
	function handleViewModeChange(newMode: string) {
		viewMode = newMode as 'raids' | 'groups'
		updateViewUrl(viewMode)
	}

	// Query for raids
	const raidsQuery = createQuery(() => ({
		queryKey: ['raids', 'list'],
		queryFn: () => raidAdapter.getAll(),
		staleTime: 1000 * 60 * 5
	}))

	// Query for raid groups (for filter dropdown)
	const groupsQuery = createQuery(() => ({
		queryKey: ['raid-groups', 'list'],
		queryFn: () => raidAdapter.getGroups(),
		staleTime: 1000 * 60 * 10
	}))

	// Build group options for Select
	const groupOptions = $derived(
		(groupsQuery.data ?? []).map((g) => ({
			value: g.id,
			label: displayName(g)
		}))
	)

	// Filter and sort raids
	const filteredRaids = $derived.by(() => {
		let raids = raidsQuery.data ?? []

		// Apply text search
		if (searchTerm.trim()) {
			const term = searchTerm.toLowerCase()
			raids = raids.filter(
				(r) =>
					r.name.en?.toLowerCase().includes(term) ||
					r.name.ja?.toLowerCase().includes(term) ||
					r.slug?.toLowerCase().includes(term)
			)
		}

		// Apply element filter (multi-select)
		if (elementFilters.length > 0) {
			raids = raids.filter((r) => r.element !== undefined && elementFilters.includes(r.element))
		}

		// Apply group filter
		if (groupFilter) {
			raids = raids.filter((r) => r.group?.id === groupFilter)
		}

		// Apply HL filter (1 = yes, 0 = no)
		if (hlFilter !== undefined) {
			const hlBool = hlFilter === 1
			raids = raids.filter((r) => r.group?.hl === hlBool)
		}

		// Apply Extra filter (1 = yes, 0 = no)
		if (extraFilter !== undefined) {
			const extraBool = extraFilter === 1
			raids = raids.filter((r) => r.extra === extraBool)
		}

		// Sort by group section, then group order, then element
		return [...raids].sort((a, b) => {
			// Section first (may be string or number)
			const sectionA = Number(a.group?.section) || 999
			const sectionB = Number(b.group?.section) || 999
			if (sectionA !== sectionB) {
				return sectionA - sectionB
			}
			// Then group order
			const groupOrderA = a.group?.order ?? 999
			const groupOrderB = b.group?.order ?? 999
			if (groupOrderA !== groupOrderB) {
				return groupOrderA - groupOrderB
			}
			// Then element
			return (a.element ?? 999) - (b.element ?? 999)
		})
	})

	// Navigate to raid detail
	function handleRaidClick(raid: Raid) {
		goto(`/database/raids/${raid.slug}`)
	}

	// Navigate to raid group detail
	function handleGroupClick(group: RaidGroupFull) {
		goto(`/database/raid-groups/${group.id}`)
	}

	// Check if any filters are active
	const hasActiveFilters = $derived(
		elementFilters.length > 0 ||
		groupFilter !== undefined ||
		hlFilter !== undefined ||
		extraFilter !== undefined
	)

	// Clear all filters
	function clearFilters() {
		elementFilters = []
		groupFilter = undefined
		hlFilter = undefined
		extraFilter = undefined
	}

	// Element options (matching internal mapping)
	const elements = [
		{ value: 0, label: 'Null', color: '#888' },
		{ value: 1, label: 'Wind', color: '#4A9B3F' },
		{ value: 2, label: 'Fire', color: '#D94444' },
		{ value: 3, label: 'Water', color: '#4A7FB8' },
		{ value: 4, label: 'Earth', color: '#9B6E3F' },
		{ value: 5, label: 'Dark', color: '#6B3E9B' },
		{ value: 6, label: 'Light', color: '#F4B643' }
	]

	// Boolean filter options
	const booleanOptions = [
		{ value: 1, label: 'Yes' },
		{ value: 0, label: 'No' }
	]

	// ==================== Raids Grid Configuration ====================

	// Sort state for raids grid
	let raidsSortMarks = $state<Record<string, { order: 'asc' | 'desc' }>>({})

	// Raids grid columns
	const raidsColumns: IColumn[] = [
		{
			id: 'image',
			header: '',
			width: 80,
			cell: RaidGridImageCell
		},
		{
			id: 'name',
			header: 'Name',
			flexgrow: 1,
			sort: true,
			cell: RaidNameCell
		},
		{
			id: 'level',
			header: 'Level',
			width: 80,
			sort: true,
			template: (val: any) => val?.toString() ?? '-'
		},
		{
			id: 'element',
			header: 'Element',
			width: 100,
			sort: true,
			cell: ElementCell
		},
		{
			id: 'group',
			header: 'Group',
			width: 180,
			template: (_val: any, row: any) => row.group ? displayName(row.group) : '-'
		}
	]

	// Raids grid API reference
	let raidsGridApi: any

	// Initialize raids grid
	const initRaidsGrid = (apiRef: any) => {
		raidsGridApi = apiRef

		// Intercept sort-rows for client-side sorting
		raidsGridApi.intercept('sort-rows', (ev: { key: string; add: boolean }) => {
			const { key } = ev
			const currentOrder = raidsSortMarks[key]?.order

			if (currentOrder === 'asc') {
				raidsSortMarks = { [key]: { order: 'desc' } }
			} else if (currentOrder === 'desc') {
				raidsSortMarks = {}
			} else {
				raidsSortMarks = { [key]: { order: 'asc' } }
			}

			return false
		})

		// Row click handler
		raidsGridApi.on('select-row', (ev: any) => {
			const rowId = ev.id
			if (rowId) {
				const raid = filteredRaids.find((r: any) => r.id === rowId)
				if (raid) {
					handleRaidClick(raid)
				}
			}
		})
	}

	// Sort filtered raids based on sort marks (or use default sort)
	const sortedRaidsData = $derived.by(() => {
		const sortKey = Object.keys(raidsSortMarks)[0]
		if (!sortKey) return filteredRaids

		const order = raidsSortMarks[sortKey]?.order
		return [...filteredRaids].sort((a: any, b: any) => {
			let valA = a[sortKey]
			let valB = b[sortKey]

			// Handle name sorting (use English name)
			if (sortKey === 'name') {
				valA = a.name?.en ?? ''
				valB = b.name?.en ?? ''
			}

			// Handle numeric values
			if (typeof valA === 'number' && typeof valB === 'number') {
				return order === 'asc' ? valA - valB : valB - valA
			}

			// Handle string values
			const strA = String(valA ?? '')
			const strB = String(valB ?? '')
			return order === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA)
		})
	})

	// ==================== Groups Grid Configuration ====================

	// Sort state for groups grid
	let groupsSortMarks = $state<Record<string, { order: 'asc' | 'desc' }>>({})

	// Groups grid columns
	const groupsColumns: IColumn[] = [
		{
			id: 'name',
			header: 'Name',
			flexgrow: 1,
			sort: true,
			cell: RaidGroupNameCell
		},
		{
			id: 'section',
			header: 'Section',
			width: 100,
			sort: true,
			template: (val: any) => getRaidSectionLabel(val)
		},
		{
			id: 'player_count',
			header: 'Players',
			width: 100,
			template: (_val: any, row: any) => {
				const raids = row.raids ?? []
				const counts: number[] = [...new Set<number>(raids.map((r: any) => r.playerCount).filter(Boolean))]
				counts.sort((a, b) => a - b)
				return counts.length > 0 ? counts.join(', ') : '-'
			}
		},
		{
			id: 'difficulty',
			header: 'Difficulty',
			width: 100,
			sort: true,
			template: (val: any) => val?.toString() ?? '-'
		},
		{
			id: 'flags',
			header: 'Flags',
			width: 180,
			cell: RaidGroupFlagsCell
		},
		{
			id: 'raids',
			header: 'Raids',
			width: 80,
			template: (_val: any, row: any) => row.raids?.length?.toString() ?? '0'
		}
	]

	// Sorted groups data
	const sortedGroupsData = $derived.by(() => {
		const groups = groupsQuery.data ?? []
		const sortKey = Object.keys(groupsSortMarks)[0]
		if (!sortKey) return groups

		const order = groupsSortMarks[sortKey]?.order
		return [...groups].sort((a: any, b: any) => {
			let valA = a[sortKey]
			let valB = b[sortKey]

			// Handle name sorting (use English name)
			if (sortKey === 'name') {
				valA = a.name?.en ?? ''
				valB = b.name?.en ?? ''
			}

			// Handle numeric values
			if (typeof valA === 'number' && typeof valB === 'number') {
				return order === 'asc' ? valA - valB : valB - valA
			}

			// Handle string values
			const strA = String(valA ?? '')
			const strB = String(valB ?? '')
			return order === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA)
		})
	})

	// Groups grid API reference
	let groupsGridApi: any

	// Initialize groups grid
	const initGroupsGrid = (apiRef: any) => {
		groupsGridApi = apiRef

		// Intercept sort-rows for client-side sorting
		groupsGridApi.intercept('sort-rows', (ev: { key: string; add: boolean }) => {
			const { key } = ev
			const currentOrder = groupsSortMarks[key]?.order

			// Toggle: asc -> desc -> clear
			if (currentOrder === 'asc') {
				groupsSortMarks = { [key]: { order: 'desc' } }
			} else if (currentOrder === 'desc') {
				groupsSortMarks = {}
			} else {
				groupsSortMarks = { [key]: { order: 'asc' } }
			}

			return false // Prevent default sorting
		})

		// Row click handler
		groupsGridApi.on('select-row', (ev: any) => {
			const rowId = ev.id
			if (rowId) {
				const group = (groupsQuery.data ?? []).find((g: any) => g.id === rowId)
				if (group) {
					handleGroupClick(group)
				}
			}
		})
	}
</script>

<svelte:head>
	<link rel="stylesheet" href="https://cdn.svar.dev/fonts/wxi/wx-icons.css" />
</svelte:head>

<PageMeta title="Database - Raids" description="Manage raids in the database" />

<div class="page">
	<div class="grid">
		<div class="controls">
			<SegmentedControl bind:value={viewMode} onValueChange={handleViewModeChange} size="xsmall" variant="background">
				<Segment value="raids">Raids</Segment>
				<Segment value="groups">Groups</Segment>
			</SegmentedControl>

			{#if viewMode === 'raids'}
				<div class="filters">
					<MultiSelect
						options={elements}
						bind:value={elementFilters}
						placeholder="Element"
						size="small"
					/>

					<Select
						options={groupOptions}
						bind:value={groupFilter}
						placeholder="Raid Group"
						size="small"
					/>

					<Select
						options={booleanOptions}
						bind:value={hlFilter}
						placeholder="HL"
						size="small"
					/>

					<Select
						options={booleanOptions}
						bind:value={extraFilter}
						placeholder="Extra"
						size="small"
					/>

					{#if hasActiveFilters}
						<button type="button" class="clear-btn" onclick={clearFilters}>Clear</button>
					{/if}
				</div>

				<div class="controls-right">
					<input type="text" placeholder="Search..." bind:value={searchTerm} />
				</div>
			{/if}
		</div>

		{#if viewMode === 'raids'}
			<div class="grid-wrapper" class:loading={raidsQuery.isLoading}>
				{#if raidsQuery.isLoading}
					<div class="loading-overlay">
						<div class="loading-spinner">Loading...</div>
					</div>
				{/if}

				<Grid
					data={sortedRaidsData}
					columns={raidsColumns}
					init={initRaidsGrid}
					sortMarks={raidsSortMarks}
					sizes={{ rowHeight: 64 }}
					class="database-grid-theme"
				/>
			</div>

			<div class="grid-footer">
				<div class="pagination-info">
					{filteredRaids.length} raid{filteredRaids.length === 1 ? '' : 's'}
				</div>
			</div>
		{:else}
			<div class="grid-wrapper" class:loading={groupsQuery.isLoading}>
				{#if groupsQuery.isLoading}
					<div class="loading-overlay">
						<div class="loading-spinner">Loading...</div>
					</div>
				{/if}

				<Grid
					data={sortedGroupsData}
					columns={groupsColumns}
					init={initGroupsGrid}
					sortMarks={groupsSortMarks}
					sizes={{ rowHeight: 48 }}
					class="database-grid-theme"
				/>
			</div>

			<div class="grid-footer">
				<div class="pagination-info">
					{sortedGroupsData.length} group{sortedGroupsData.length === 1 ? '' : 's'}
				</div>
			</div>
		{/if}
	</div>
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
	}

	.controls {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		padding: spacing.$unit;
		border-bottom: 1px solid var(--border-subtle);
		gap: spacing.$unit;

		.filters {
			display: flex;
			flex-wrap: wrap;
			align-items: center;
			gap: spacing.$unit;
			flex: 1;
			min-width: 0;
		}

		.controls-right {
			display: flex;
			align-items: center;
			gap: spacing.$unit;
			flex-shrink: 0;

			input {
				padding: spacing.$unit spacing.$unit-2x;
				background: var(--input-bound-bg);
				border: none;
				border-radius: layout.$item-corner;
				font-family: 'AGrot', system-ui, sans-serif;
				font-size: typography.$font-small;
				width: 200px;

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

	.clear-btn {
		background: none;
		border: none;
		padding: spacing.$unit-half spacing.$unit;
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		color: var(--accent-blue);
		cursor: pointer;

		&:hover {
			text-decoration: underline;
		}
	}

	.grid-wrapper {
		position: relative;
		overflow-x: auto;
		min-height: 200px;

		&.loading {
			opacity: 0.6;
		}
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

	// SVAR Grid styles (using design system variables)
	:global(.database-grid-theme) {
		font-size: typography.$font-small;
		width: 100%;
	}

	:global(.wx-grid .wx-header) {
		background: var(--bar-bg);
	}

	:global(.wx-grid .wx-h-row) {
		background: var(--bar-bg);
		border-bottom: 1px solid var(--border-subtle);
	}

	:global(.wx-grid .wx-header-cell) {
		background: var(--bar-bg);
		font-weight: typography.$bold;
		color: var(--text-secondary);
		border-bottom: 2px solid var(--border-medium);
		border-radius: layout.$item-corner;
		transition: background-color 0.15s ease;
		cursor: pointer;

		&:hover {
			background: var(--button-bg-hover);
		}
	}

	:global(.wx-grid .wx-cell) {
		padding: spacing.$unit * 0.5;
		vertical-align: middle;
		display: flex;
		align-items: center;
		border: none;
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
