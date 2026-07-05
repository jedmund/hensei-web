<script lang="ts">
	import { goto } from '$app/navigation'
	import { createQuery } from '@tanstack/svelte-query'
	import { entityAdapter } from '$lib/api/adapters/entity.adapter'
	import PageMeta from '$lib/components/PageMeta.svelte'
	import type { WeaponSkillFamilySummary } from '$lib/types/api/weaponSkillFamily'

	const familiesQuery = createQuery(() => ({
		queryKey: ['weaponSkillFamilies'],
		queryFn: () => entityAdapter.getWeaponSkillFamilies()
	}))

	let searchTerm = $state('')
	let seriesFilter = $state('')
	let sizeFilter = $state('')
	let boostTypeFilter = $state('')

	const allFamilies = $derived(familiesQuery.data ?? [])

	const boostTypeOptions = $derived([...new Set(allFamilies.flatMap((f) => f.boostTypes))].sort())

	const filteredFamilies = $derived.by(() => {
		let families = allFamilies
		if (searchTerm.trim()) {
			const term = searchTerm.toLowerCase()
			families = families.filter(
				(f) =>
					f.modifier.toLowerCase().includes(term) ||
					f.displayName?.en?.toLowerCase().includes(term) ||
					f.displayName?.ja?.toLowerCase().includes(term)
			)
		}
		if (seriesFilter) families = families.filter((f) => f.series.includes(seriesFilter))
		if (sizeFilter) families = families.filter((f) => f.sizes.includes(sizeFilter))
		if (boostTypeFilter) families = families.filter((f) => f.boostTypes.includes(boostTypeFilter))
		return families
	})

	const editedCount = $derived(allFamilies.filter((f) => f.manuallyEdited).length)

	function handleRowClick(family: WeaponSkillFamilySummary) {
		goto(`/database/weapon-skills/${encodeURIComponent(family.modifier)}`)
	}
</script>

<PageMeta title="Weapon Skills" description="Weapon skill families and calculator data" />

<div class="page">
	<div class="grid-container">
		<div class="controls">
			<input
				type="text"
				placeholder="Search skill families..."
				bind:value={searchTerm}
				class="search"
			/>
			<select bind:value={seriesFilter} class="filter-select">
				<option value="">All series</option>
				<option value="normal">Normal</option>
				<option value="omega">Omega</option>
				<option value="ex">EX</option>
				<option value="odious">Odious</option>
			</select>
			<select bind:value={sizeFilter} class="filter-select">
				<option value="">All sizes</option>
				{#each ['small', 'medium', 'big', 'big2', 'massive', 'ancestral'] as size (size)}
					<option value={size}>{size}</option>
				{/each}
			</select>
			<select bind:value={boostTypeFilter} class="filter-select">
				<option value="">All boost types</option>
				{#each boostTypeOptions as bt (bt)}
					<option value={bt}>{bt}</option>
				{/each}
			</select>
		</div>

		{#if editedCount > 0}
			<div class="export-reminder">
				{editedCount}
				{editedCount === 1 ? 'family carries' : 'families carry'} manual edits — run
				<code>rake granblue:export_weapon_skill_data</code> /
				<code>granblue:export_weapon_skill_effects</code> to snapshot them.
			</div>
		{/if}

		{#if familiesQuery.isLoading}
			<div class="loading">Loading skill families...</div>
		{:else if familiesQuery.isError}
			<div class="error">Failed to load skill families</div>
		{:else}
			<div class="table-wrapper">
				<table class="data-table">
					<thead>
						<tr>
							<th>Family</th>
							<th>Boost Types</th>
							<th>Series</th>
							<th>Sizes</th>
							<th class="num">Data</th>
							<th class="num">Effects</th>
							<th class="num">Weapons</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{#each filteredFamilies as family (family.modifier)}
							<tr onclick={() => handleRowClick(family)} class="clickable">
								<td>
									<div class="name-cell">
										<span class="name-en">{family.displayName?.en ?? family.modifier}</span>
										<span class="modifier">{family.modifier}</span>
									</div>
								</td>
								<td>
									<div class="chips">
										{#each family.boostTypes.slice(0, 4) as bt (bt)}
											<span class="chip">{bt}</span>
										{/each}
										{#if family.boostTypes.length > 4}
											<span class="chip more">+{family.boostTypes.length - 4}</span>
										{/if}
									</div>
								</td>
								<td>{family.series.join(', ') || '—'}</td>
								<td>{family.sizes.join(', ') || '—'}</td>
								<td class="num">{family.counts.dataRows}</td>
								<td class="num">{family.counts.effectRows}</td>
								<td class="num">{family.counts.weapons}</td>
								<td>
									{#if family.manuallyEdited}
										<span class="edited-badge">edited</span>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<div class="footer">
				Showing {filteredFamilies.length} of {allFamilies.length} skill families
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

	.controls {
		display: flex;
		align-items: center;
		padding: spacing.$unit;
		border-bottom: 1px solid var(--table-border);
		gap: spacing.$unit;

		.search {
			padding: spacing.$unit spacing.$unit-2x;
			background: var(--input-bound-bg);
			border: none;
			border-radius: layout.$item-corner;
			font-size: typography.$font-medium;
			flex: 1;

			&:hover {
				background: var(--input-bound-bg-hover);
			}

			&:focus {
				outline: none;
				box-shadow: 0 0 0 2px var(--blue);
			}
		}

		.filter-select {
			padding: spacing.$unit;
			background: var(--input-bound-bg);
			border: none;
			border-radius: layout.$item-corner;
			font-size: typography.$font-small;
			color: var(--text-primary);
		}
	}

	.export-reminder {
		padding: spacing.$unit spacing.$unit-2x;
		background: var(--notice-yellow-bg, rgba(224, 138, 0, 0.1));
		color: var(--text-secondary);
		font-size: typography.$font-small;
		border-bottom: 1px solid var(--table-border);

		code {
			font-size: typography.$font-tiny;
		}
	}

	.loading,
	.error {
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
		font-size: typography.$font-small;

		th {
			text-align: left;
			font-weight: typography.$medium;
			color: var(--text-secondary);
			padding: spacing.$unit spacing.$unit-2x;
			border-bottom: 1px solid var(--table-border);
			white-space: nowrap;
		}

		td {
			padding: spacing.$unit spacing.$unit-2x;
			border-bottom: 1px solid var(--table-border);
			vertical-align: middle;
			color: var(--text-primary);
		}

		.num {
			text-align: right;
			font-variant-numeric: tabular-nums;
		}

		tr.clickable {
			cursor: pointer;

			&:hover {
				background: var(--button-bg);
			}
		}
	}

	.name-cell {
		display: flex;
		flex-direction: column;
		gap: 2px;

		.name-en {
			font-weight: typography.$medium;
		}

		.modifier {
			font-family: monospace;
			font-size: typography.$font-tiny;
			color: var(--text-tertiary);
		}
	}

	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: spacing.$unit-half;
	}

	.chip {
		display: inline-block;
		padding: 0 spacing.$unit-half;
		border-radius: layout.$item-corner-small;
		background: var(--button-bg);
		color: var(--text-secondary);
		font-size: typography.$font-tiny;
		white-space: nowrap;

		&.more {
			color: var(--text-tertiary);
		}
	}

	.edited-badge {
		display: inline-block;
		padding: 0 spacing.$unit-half;
		border-radius: layout.$item-corner-small;
		background: var(--notice-yellow-bg, rgba(224, 138, 0, 0.15));
		color: var(--orange-text, #e08a00);
		font-size: typography.$font-tiny;
		font-weight: typography.$medium;
	}

	.footer {
		padding: spacing.$unit spacing.$unit-2x;
		color: var(--text-tertiary);
		font-size: typography.$font-small;
	}
</style>
