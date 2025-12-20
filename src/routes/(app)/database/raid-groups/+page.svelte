<svelte:options runes={true} />

<script lang="ts">
	import PageMeta from '$lib/components/PageMeta.svelte'
	import * as m from '$lib/paraglide/messages'
	import { goto } from '$app/navigation'
	import { createQuery } from '@tanstack/svelte-query'
	import { raidAdapter } from '$lib/api/adapters/raid.adapter'
	import Button from '$lib/components/ui/Button.svelte'
	import type { RaidGroupFull } from '$lib/types/api/raid'

	function displayName(input: any): string {
		if (!input) return '—'
		const maybe = input.name ?? input
		if (typeof maybe === 'string') return maybe
		if (maybe && typeof maybe === 'object') return maybe.en || maybe.ja || '—'
		return '—'
	}

	// State
	let searchTerm = $state('')

	// Query for raid groups
	const groupsQuery = createQuery(() => ({
		queryKey: ['raid-groups', 'list'],
		queryFn: () => raidAdapter.getGroups(),
		staleTime: 1000 * 60 * 5
	}))

	// Filter groups
	const filteredGroups = $derived.by(() => {
		let groups = groupsQuery.data ?? []

		// Apply text search
		if (searchTerm.trim()) {
			const term = searchTerm.toLowerCase()
			groups = groups.filter(
				(g) =>
					g.name.en?.toLowerCase().includes(term) ||
					g.name.ja?.toLowerCase().includes(term)
			)
		}

		return groups
	})

	// Navigate to group detail
	function handleRowClick(group: RaidGroupFull) {
		goto(`/database/raid-groups/${group.id}`)
	}
</script>

<PageMeta title="Database - Raid Groups" description="Manage raid groups in the database" />

<div class="page">
	<div class="grid">
		<div class="controls">
			<input type="text" placeholder="Search groups..." bind:value={searchTerm} />

			<div class="controls-right">
				<Button variant="primary" size="small" onclick={() => goto('/database/raid-groups/new')}>
					New Group
				</Button>
			</div>
		</div>

		<div class="grid-wrapper" class:loading={groupsQuery.isLoading}>
			{#if groupsQuery.isLoading}
				<div class="loading-overlay">
					<div class="loading-spinner">Loading...</div>
				</div>
			{/if}

			<table class="groups-table">
				<thead>
					<tr>
						<th class="col-name">Name</th>
						<th class="col-difficulty">Difficulty</th>
						<th class="col-section">Section</th>
						<th class="col-order">Order</th>
						<th class="col-flags">Flags</th>
						<th class="col-raids">Raids</th>
					</tr>
				</thead>
				<tbody>
					{#if filteredGroups.length === 0 && !groupsQuery.isLoading}
						<tr>
							<td colspan="6" class="empty-state">
								{searchTerm ? 'No groups match your search' : 'No raid groups yet'}
							</td>
						</tr>
					{:else}
						{#each filteredGroups as group}
							<tr onclick={() => handleRowClick(group)} class="clickable">
								<td class="col-name">
									<span class="group-name">{displayName(group)}</span>
								</td>
								<td class="col-difficulty">
									{group.difficulty ?? '-'}
								</td>
								<td class="col-section">
									{group.section}
								</td>
								<td class="col-order">
									{group.order}
								</td>
								<td class="col-flags">
									<div class="flags">
										{#if group.hl}
											<span class="flag hl">HL</span>
										{/if}
										{#if group.extra}
											<span class="flag extra">Extra</span>
										{/if}
										{#if group.guidebooks}
											<span class="flag guidebooks">Guidebooks</span>
										{/if}
									</div>
								</td>
								<td class="col-raids">
									{group.raids?.length ?? 0}
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>

		<div class="grid-footer">
			<div class="pagination-info">
				{filteredGroups.length} group{filteredGroups.length === 1 ? '' : 's'}
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
		justify-content: space-between;
		align-items: center;
		padding: spacing.$unit;
		border-bottom: 1px solid #e5e5e5;
		gap: spacing.$unit;

		input {
			padding: spacing.$unit spacing.$unit-2x;
			background: var(--input-bound-bg);
			border: none;
			border-radius: layout.$item-corner;
			font-size: typography.$font-medium;
			width: 100%;
			max-width: 300px;

			&:hover {
				background: var(--input-bound-bg-hover);
			}

			&:focus {
				outline: none;
				border-color: #007bff;
			}
		}

		.controls-right {
			display: flex;
			align-items: center;
			gap: spacing.$unit;
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
		background: rgba(255, 255, 255, 0.9);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 10;

		.loading-spinner {
			font-size: typography.$font-medium;
			color: #666;
		}
	}

	.groups-table {
		width: 100%;
		border-collapse: collapse;

		th,
		td {
			padding: spacing.$unit spacing.$unit-2x;
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

		.col-name {
			min-width: 200px;
		}

		.col-difficulty,
		.col-section,
		.col-order,
		.col-raids {
			width: 80px;
			text-align: center;
		}

		.col-flags {
			min-width: 180px;
		}
	}

	.group-name {
		font-weight: typography.$bold;
	}

	.flags {
		display: flex;
		gap: 4px;
		flex-wrap: wrap;
	}

	.flag {
		display: inline-block;
		padding: 2px 6px;
		border-radius: 3px;
		font-size: typography.$font-tiny;
		font-weight: typography.$bold;

		&.hl {
			background: #dc3545;
			color: white;
		}

		&.extra {
			background: #6f42c1;
			color: white;
		}

		&.guidebooks {
			background: #28a745;
			color: white;
		}
	}

	.empty-state {
		text-align: center;
		color: #666;
		padding: spacing.$unit-4x !important;
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
