
<script lang="ts">
	import { goto } from '$app/navigation'
	import { createQuery } from '@tanstack/svelte-query'
	import { Grid } from 'wx-svelte-grid'
	import type { IColumn } from 'wx-svelte-grid'
	import { jobQueries } from '$lib/api/queries/job.queries'
	import PageMeta from '$lib/components/PageMeta.svelte'
	import * as m from '$lib/paraglide/messages'
	import { localizedName } from '$lib/utils/locale'
	import SegmentedControl from '$lib/components/ui/segmented-control/SegmentedControl.svelte'
	import Segment from '$lib/components/ui/segmented-control/Segment.svelte'
	import Select from '$lib/components/ui/Select.svelte'
	import type { JobSkill } from '$lib/types/api/entities'
	import { getSkillColorName } from '$lib/utils/jobUtils'

	// Cell components
	import JobSkillIconCell from '$lib/components/database/cells/JobSkillIconCell.svelte'
	import JobSkillTypeCell from '$lib/components/database/cells/JobSkillTypeCell.svelte'
	import AccessoryJobCell from '$lib/components/database/cells/AccessoryJobCell.svelte'

	// Navigation segment - used to link back to Jobs/Accessories views
	let viewMode = $state<'jobs' | 'accessories' | 'skills'>('skills')

	$effect(() => {
		if (viewMode === 'jobs') {
			goto('/database/jobs', { replaceState: true, noScroll: true })
		} else if (viewMode === 'accessories') {
			goto('/database/jobs?view=accessories', { replaceState: true, noScroll: true })
		}
	})

	// Skill type filter
	let selectedType = $state<string>('all')

	const typeOptions = [
		{ value: 'all', label: 'All types' },
		{ value: 'main', label: 'Main' },
		{ value: 'sub', label: 'Subskill' },
		{ value: 'emp', label: 'EMP' },
		{ value: 'base', label: 'Base' }
	]

	// Fetch all skills
	const skillsQuery = createQuery(() => jobQueries.allSkills())

	// Search state
	let searchTerm = $state('')

	// Filter and sort skills
	const skillData = $derived.by(() => {
		const skills = skillsQuery.data ?? []
		let filtered = skills

		// Type filter
		if (selectedType !== 'all') {
			filtered = filtered.filter((s) => {
				if (selectedType === 'main') return s.main
				if (selectedType === 'sub') return s.sub
				if (selectedType === 'emp') return s.emp
				if (selectedType === 'base') return s.base
				return true
			})
		}

		// Search filter
		if (searchTerm.trim()) {
			const term = searchTerm.toLowerCase()
			filtered = filtered.filter(
				(s) =>
					s.name.en?.toLowerCase().includes(term) ||
					s.name.ja?.toLowerCase().includes(term) ||
					localizedName(s.job?.name)?.toLowerCase().includes(term) ||
					s.slug?.toLowerCase().includes(term)
			)
		}

		return [...filtered].sort((a, b) => {
			const jobCompare = localizedName(a.job?.name).localeCompare(localizedName(b.job?.name))
			if (jobCompare !== 0) return jobCompare
			return (a.order ?? 0) - (b.order ?? 0)
		})
	})

	// Grid columns
	const columns: IColumn[] = [
		{
			id: 'slug',
			header: '',
			width: 60,
			cell: JobSkillIconCell
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
			id: 'skillType',
			header: 'Type',
			width: 100,
			cell: JobSkillTypeCell
		},
		{
			id: 'job',
			header: 'Job',
			width: 180,
			sort: true,
			cell: AccessoryJobCell
		},
		{
			id: 'color',
			header: 'Color',
			width: 80,
			sort: true,
			template: (color: number) => getSkillColorName(color)
		},
		{
			id: 'order',
			header: 'Order',
			width: 80,
			sort: true
		}
	]

	// Grid init
	const initGrid = (apiRef: any) => {
		apiRef.on('select-row', (ev: any) => {
			const rowId = ev.id
			if (rowId) {
				const rowData = skillData.find((item) => item.id === rowId)
				if (rowData) {
					goto(`/database/job-skills/${rowData.id}`)
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
				<input type="text" placeholder="Search..." bind:value={searchTerm} />
			</div>
		</div>

		<div class="grid-wrapper" class:loading={skillsQuery.isLoading}>
			{#if skillsQuery.isLoading}
				<div class="loading-overlay">
					<div class="loading-spinner">Loading...</div>
				</div>
			{/if}

			<Grid
				data={skillData}
				columns={columns}
				init={initGrid}
				sizes={{ rowHeight: 60 }}
				class="database-grid-theme"
			/>
		</div>

		<div class="grid-footer">
			<div class="pagination-info">
				{#if skillData.length > 0}
					Showing {skillData.length} of {skillsQuery.data?.length ?? 0} skills
				{:else}
					No skills found
				{/if}
			</div>
		</div>
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
					border: none;
					border-radius: layout.$item-corner;
					font-family: 'AGrot', system-ui, sans-serif;
					font-size: typography.$font-small;
					width: 200px;
					color: var(--text-primary);

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
