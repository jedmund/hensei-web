
<script lang="ts">
	import PageMeta from '$lib/components/PageMeta.svelte'
	import * as m from '$lib/paraglide/messages'
	import { goto } from '$app/navigation'
	import { createQuery } from '@tanstack/svelte-query'
	import { bulletQueries } from '$lib/api/queries/bullet.queries'
	import { BULLET_TYPES } from '$lib/types/api/entities'
	import type { Bullet } from '$lib/types/api/entities'
	import { localizedName } from '$lib/utils/locale'
	import BulletImageCell from '$lib/components/database/cells/BulletImageCell.svelte'
	import { Grid } from 'wx-svelte-grid'
	import type { IColumn } from 'wx-svelte-grid'

	let searchTerm = $state('')

	const bulletsQuery = createQuery(() => bulletQueries.list())

	const filteredBullets = $derived.by(() => {
		let bullets = bulletsQuery.data ?? []

		if (searchTerm.trim()) {
			const term = searchTerm.toLowerCase()
			bullets = bullets.filter(
				(b) =>
					b.name.en?.toLowerCase().includes(term) ||
					b.name.ja?.toLowerCase().includes(term) ||
					b.slug?.toLowerCase().includes(term)
			)
		}

		return [...bullets].sort((a, b) => {
			if (a.bulletType !== b.bulletType) return a.bulletType - b.bulletType
			return a.order - b.order
		})
	})

	function handleBulletClick(bullet: Bullet) {
		goto(`/database/bullets/${bullet.granblueId || bullet.id}`)
	}

	// Grid configuration
	let sortMarks = $state<Record<string, { order: 'asc' | 'desc' }>>({})
	let gridApi: any

	const columns: IColumn[] = [
		{
			id: 'granblueId',
			header: '',
			width: 80,
			cell: BulletImageCell
		},
		{
			id: 'name',
			header: 'Name',
			flexgrow: 1,
			sort: true,
			template: (_val: any, row: any) => localizedName(row.name)
		},
		{
			id: 'bulletType',
			header: 'Type',
			width: 120,
			sort: true,
			template: (val: any) => BULLET_TYPES[val] ?? 'Unknown'
		},
		{
			id: 'atk',
			header: 'ATK',
			width: 80,
			sort: true,
			template: (val: any) => val?.toString() ?? '0'
		},
		{
			id: 'hitsAll',
			header: 'Hits All',
			width: 80,
			template: (val: any) => val ? 'Yes' : 'No'
		},
		{
			id: 'effect',
			header: 'Effect',
			flexgrow: 1,
			template: (_val: any, row: any) => row.effect?.en ?? '—'
		}
	]

	const initGrid = (apiRef: any) => {
		gridApi = apiRef

		gridApi.intercept('sort-rows', (ev: { key: string; add: boolean }) => {
			const { key } = ev
			const currentOrder = sortMarks[key]?.order

			if (currentOrder === 'asc') {
				sortMarks = { [key]: { order: 'desc' } }
			} else if (currentOrder === 'desc') {
				sortMarks = {}
			} else {
				sortMarks = { [key]: { order: 'asc' } }
			}

			return false
		})

		gridApi.on('select-row', (ev: any) => {
			const rowId = ev.id
			if (rowId) {
				const bullet = filteredBullets.find((b: any) => b.id === rowId)
				if (bullet) {
					handleBulletClick(bullet)
				}
			}
		})
	}

	const sortedData = $derived.by(() => {
		const sortKey = Object.keys(sortMarks)[0]
		if (!sortKey) return filteredBullets

		const order = sortMarks[sortKey]?.order
		return [...filteredBullets].sort((a: any, b: any) => {
			let valA = a[sortKey]
			let valB = b[sortKey]

			if (sortKey === 'name') {
				valA = a.name?.en ?? ''
				valB = b.name?.en ?? ''
			}

			if (typeof valA === 'number' && typeof valB === 'number') {
				return order === 'asc' ? valA - valB : valB - valA
			}

			const strA = String(valA ?? '')
			const strB = String(valB ?? '')
			return order === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA)
		})
	})
</script>

<svelte:head>
	<link rel="stylesheet" href="https://cdn.svar.dev/fonts/wxi/wx-icons.css" />
</svelte:head>

<PageMeta title="Database - Bullets" description="Manage bullets in the database" />

<div class="page">
	<div class="grid">
		<div class="controls">
			<div class="controls-right">
				<input type="text" placeholder="Search..." bind:value={searchTerm} />
			</div>
		</div>

		<div class="grid-wrapper" class:loading={bulletsQuery.isLoading}>
			{#if bulletsQuery.isLoading}
				<div class="loading-overlay">
					<div class="loading-spinner">Loading...</div>
				</div>
			{/if}

			<Grid
				data={sortedData}
				columns={columns}
				init={initGrid}
				{sortMarks}
				sizes={{ rowHeight: 48 }}
				class="database-grid-theme"
			/>
		</div>

		<div class="grid-footer">
			<div class="pagination-info">
				{filteredBullets.length} bullet{filteredBullets.length === 1 ? '' : 's'}
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
	}

	.controls {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: flex-end;
		padding: spacing.$unit;
		border-bottom: 1px solid var(--border-subtle);
		gap: spacing.$unit;

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

	:global(.database-grid-theme) {
		font-size: typography.$font-small;
		width: 100%;
		color: var(--text-primary);
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
