<svelte:options runes={true} />

<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query'
	import { entityQueries } from '$lib/api/queries/entity.queries'
	import SegmentedControl from '$lib/components/ui/segmented-control/SegmentedControl.svelte'
	import Segment from '$lib/components/ui/segmented-control/Segment.svelte'

	type SeriesType = 'weapons' | 'characters' | 'summons'

	let activeType = $state<SeriesType>('weapons')

	// Fetch all series lists
	const weaponSeriesQuery = createQuery(() => entityQueries.weaponSeriesList())
	const characterSeriesQuery = createQuery(() => entityQueries.characterSeriesList())
	const summonSeriesQuery = createQuery(() => entityQueries.summonSeriesList())

	// Get active query based on selected type
	const activeQuery = $derived.by(() => {
		switch (activeType) {
			case 'weapons':
				return weaponSeriesQuery
			case 'characters':
				return characterSeriesQuery
			case 'summons':
				return summonSeriesQuery
		}
	})

	// Get sorted data
	const sortedData = $derived.by(() => {
		if (!activeQuery.data) return []
		return [...activeQuery.data].sort((a, b) => a.order - b.order)
	})

	// Check if the current type has flags (only weapons)
	const hasFlags = $derived(activeType === 'weapons')
</script>

<div class="database-page">
	<div class="grid-container">
		<nav class="series-nav" aria-label="Series type">
			<SegmentedControl bind:value={activeType} variant="blended" size="small">
				<Segment value="weapons">Weapons</Segment>
				<Segment value="characters">Characters</Segment>
				<Segment value="summons">Summons</Segment>
			</SegmentedControl>
		</nav>

		{#if activeQuery.isPending}
			<div class="loading">Loading {activeType} series...</div>
		{:else if activeQuery.error}
			<div class="error">Failed to load {activeType} series</div>
		{:else if sortedData.length > 0}
			<div class="series-table">
				<table>
					<thead>
						<tr>
							<th class="order">Order</th>
							<th class="name">Name (EN)</th>
							<th class="name-ja">Name (JA)</th>
							<th class="slug">Slug</th>
							{#if hasFlags}
								<th class="flags">Flags</th>
							{/if}
						</tr>
					</thead>
					<tbody>
						{#each sortedData as series (series.id)}
							<tr>
								<td class="order">{series.order}</td>
								<td class="name">{series.name.en}</td>
								<td class="name-ja">{series.name.ja}</td>
								<td class="slug"><code>{series.slug}</code></td>
								{#if hasFlags && 'extra' in series}
									<td class="flags">
										{#if series.extra}<span class="flag extra">Extra</span>{/if}
										{#if series.elementChangeable}<span class="flag element">Element</span>{/if}
										{#if series.hasWeaponKeys}<span class="flag keys">Keys</span>{/if}
										{#if series.hasAwakening}<span class="flag awaken">Awaken</span>{/if}
										{#if series.hasAxSkills}<span class="flag ax">AX</span>{/if}
									</td>
								{/if}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<div class="empty">No {activeType} series found</div>
		{/if}
	</div>
</div>

<style lang="scss">
	@use '$src/themes/colors' as colors;
	@use '$src/themes/effects' as effects;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.database-page {
		padding: spacing.$unit-2x 0;
		margin: 0 auto;
	}

	.grid-container {
		background: var(--card-bg);
		border: 0.5px solid rgba(0, 0, 0, 0.18);
		border-radius: layout.$page-corner;
		box-shadow: effects.$page-elevation;
		overflow: hidden;
	}

	.series-nav {
		display: flex;
		align-items: center;
		gap: spacing.$unit-2x;
		padding: spacing.$unit-2x;
		border-bottom: 1px solid var(--border-subtle);
	}

	.loading,
	.error,
	.empty {
		padding: spacing.$unit-4x;
		text-align: center;
		color: colors.$grey-50;
	}

	.error {
		color: var(--text-error, #ef4444);
	}

	.series-table {
		overflow-x: auto;

		table {
			width: 100%;
			border-collapse: collapse;
		}

		th,
		td {
			padding: spacing.$unit-2x spacing.$unit-3x;
			text-align: left;
			border-bottom: 1px solid var(--border-secondary, #e5e5e5);
		}

		th {
			background: var(--table-header-bg, #f9f9f9);
			font-weight: typography.$medium;
			font-size: typography.$font-small;
			color: colors.$grey-40;
		}

		td {
			font-size: typography.$font-regular;
		}

		.order {
			width: 80px;
			text-align: center;
		}

		.name {
			min-width: 200px;
		}

		.name-ja {
			min-width: 180px;
		}

		.slug code {
			font-family: 'SF Mono', Monaco, monospace;
			font-size: typography.$font-small;
			background: var(--code-bg, #f0f0f0);
			padding: spacing.$unit-fourth spacing.$unit-half;
			border-radius: 4px;
		}

		.flags {
			.flag {
				display: inline-block;
				font-size: typography.$font-tiny;
				padding: spacing.$unit-fourth spacing.$unit-half;
				margin-right: spacing.$unit-half;
				border-radius: 4px;
				font-weight: typography.$medium;

				&.extra {
					background: #f3e8ff;
					color: #6b21a8;
				}

				&.element {
					background: linear-gradient(
						to right,
						#fecaca,
						#fef08a,
						#bbf7d0,
						#bfdbfe,
						#e9d5ff,
						#fbcfe8
					);
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
		}

		tbody tr:nth-child(odd) {
			background: var(--table-row-alt, #fafafa);
		}

		tbody tr:hover {
			background: var(--table-row-hover, #f0f0f0);
		}

		tbody tr:last-child td {
			border-bottom: none;
		}
	}
</style>
