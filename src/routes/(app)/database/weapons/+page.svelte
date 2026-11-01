<script lang="ts">
	import PageMeta from '$lib/components/PageMeta.svelte'
	import * as m from '$lib/paraglide/messages'
	import { goto } from '$app/navigation'
	import { page } from '$app/stores'
	import { createQuery } from '@tanstack/svelte-query'
	import { entityQueries } from '$lib/api/queries/entity.queries'
	import { weaponSkillAdapter } from '$lib/api/adapters/weaponSkill.adapter'
	import SegmentedControl from '$lib/components/ui/segmented-control/SegmentedControl.svelte'
	import Segment from '$lib/components/ui/segmented-control/Segment.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import AwakeningModal from '$lib/features/database/weapons/AwakeningModal.svelte'
	import { getBasePath } from '$lib/utils/images/core'
	import { localizedName } from '$lib/utils/locale'
	import { getBoostTypeLabel } from '$lib/utils/boostType'
	import type { Awakening } from '$lib/types/api/entities'
	import type { WeaponSkillFamilySummary } from '$lib/types/api/weaponSkillFamily'
	import WeaponSkillIcon from '$lib/components/database/WeaponSkillIcon.svelte'
	import DataTable from '$lib/components/data-table/DataTable.svelte'
	import { createTableUrl } from '$lib/components/data-table/tableUrl.svelte'
	import { createStaticSource } from '$lib/components/data-table/staticSource.svelte'
	import type { DataTableColumn, FlagValue } from '$lib/components/data-table/types'
	import type { WeaponSeries } from '$lib/types/api/weaponSeries'
	import WeaponsTable from '$lib/features/database/weapons/WeaponsTable.svelte'
	import { ResultSet, setResultSet } from '$lib/features/database/resultSet.svelte'

	// The weapons list keeps it in step with its rows; the record panel reads it for j/k
	setResultSet(new ResultSet())

	type ViewMode = 'weapons' | 'series' | 'awakenings' | 'skills'

	// View mode follows the URL (so sidebar links can switch views); assigning
	// it from the segmented control overrides it until the URL catches up.
	const initialView = $derived($page.url.searchParams.get('view') as ViewMode | null)
	let viewMode = $derived<ViewMode>(
		initialView === 'series'
			? 'series'
			: initialView === 'awakenings'
				? 'awakenings'
				: initialView === 'skills'
					? 'skills'
					: 'weapons'
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

	// Series view: DataTable over the full list, sorted and searched from the URL
	function seriesFlags(series: WeaponSeries): FlagValue[] {
		const flags: FlagValue[] = []
		if (series.extra) flags.push({ label: m.db_weapon_series_flag_extra(), tone: 'extra' })
		if (series.elementChangeable)
			flags.push({ label: m.db_weapon_series_flag_element(), tone: 'element' })
		if (series.hasWeaponKeys) flags.push({ label: m.db_weapon_series_flag_keys(), tone: 'keys' })
		if (series.hasAwakening) flags.push({ label: m.db_weapon_series_flag_awaken(), tone: 'awaken' })
		if (series.hasAxSkills) flags.push({ label: m.db_weapon_series_flag_ax(), tone: 'ax' })
		return flags
	}

	const seriesColumns: DataTableColumn<WeaponSeries>[] = [
		{
			id: 'order',
			header: m.db_weapon_series_col_order,
			type: 'number',
			value: (s) => s.order,
			width: '80px',
			align: 'center'
		},
		{
			id: 'name',
			header: m.db_weapon_series_col_name,
			type: 'name',
			name: (s) => s.name,
			primary: true,
			minWidth: '200px'
		},
		{
			id: 'slug',
			header: m.db_weapon_series_col_slug,
			type: 'code',
			value: (s) => s.slug,
			searchable: true,
			minWidth: '150px'
		},
		{
			id: 'flags',
			header: m.db_weapon_series_col_flags,
			type: 'flags',
			flags: seriesFlags,
			minWidth: '200px'
		}
	]

	const seriesUrl = createTableUrl({ defaultSort: [{ id: 'order', desc: false }] })
	const seriesSource = createStaticSource({
		url: seriesUrl,
		columns: seriesColumns,
		data: () => weaponSeriesQuery.data,
		isPending: () => weaponSeriesQuery.isPending,
		isFetching: () => weaponSeriesQuery.isFetching,
		error: () => weaponSeriesQuery.error,
		refetch: () => weaponSeriesQuery.refetch()
	})

	// Sorted awakenings
	const sortedAwakenings = $derived.by(() => {
		if (!awakeningsQuery.data) return []
		return [...awakeningsQuery.data].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
	})

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
		return `${getBasePath()}/icons/awakening/${slug}.${ext}`
	}

	// Query for weapon skill families (client-side filtered — not paginated like the main grid)
	const weaponSkillFamiliesQuery = createQuery(() => ({
		queryKey: ['weaponSkillFamilies'],
		queryFn: () => weaponSkillAdapter.getWeaponSkillFamilies(),
		enabled: viewMode === 'skills'
	}))

	let skillsSearchTerm = $state('')
	let skillsSeriesFilter = $state('')
	let skillsSizeFilter = $state('')
	let skillsBoostTypeFilter = $state('')

	const allSkillFamilies = $derived(weaponSkillFamiliesQuery.data ?? [])

	const skillsBoostTypeOptions = $derived(
		[...new Set(allSkillFamilies.flatMap((f) => f.boostTypes))].sort()
	)

	const filteredSkillFamilies = $derived.by(() => {
		let families = allSkillFamilies
		if (skillsSearchTerm.trim()) {
			const term = skillsSearchTerm.toLowerCase()
			families = families.filter(
				(f) =>
					f.modifier.toLowerCase().includes(term) ||
					f.displayName?.en?.toLowerCase().includes(term) ||
					f.displayName?.ja?.toLowerCase().includes(term)
			)
		}
		if (skillsSeriesFilter) families = families.filter((f) => f.series.includes(skillsSeriesFilter))
		if (skillsSizeFilter) families = families.filter((f) => f.sizes.includes(skillsSizeFilter))
		if (skillsBoostTypeFilter)
			families = families.filter((f) => f.boostTypes.includes(skillsBoostTypeFilter))
		return families
	})

	const editedSkillFamiliesCount = $derived(allSkillFamilies.filter((f) => f.manuallyEdited).length)

	function handleSkillFamilyClick(family: WeaponSkillFamilySummary) {
		goto(`/database/weapon-skills/${encodeURIComponent(family.modifier)}`)
	}
</script>

<PageMeta title={m.page_title_db_weapons()} description={m.page_desc_home()} />

{#snippet viewTabs()}
	<SegmentedControl bind:value={viewMode} size="xsmall" variant="background">
		<Segment value="weapons">{m.nav_weapons()}</Segment>
		<Segment value="series">{m.db_nav_series()}</Segment>
		<Segment value="awakenings">{m.db_nav_awakenings()}</Segment>
		<Segment value="skills">{m.db_nav_skills()}</Segment>
	</SegmentedControl>
{/snippet}

<div class="database-page">
	{#if viewMode === 'weapons'}
		<WeaponsTable toolbar={viewTabs} />
	{:else if viewMode === 'series'}
		<DataTable
			columns={seriesColumns}
			source={seriesSource}
			rowId={(series) => series.id}
			rowHref={(series) => `/database/series/weapons/${series.slug}`}
			rowTitle={(series) => localizedName(series.name)}
			storageKey="weapon-series"
			label={m.nav_new_weapon_series()}
			emptyMessage={m.db_weapon_series_empty()}
		>
			{#snippet toolbar()}
				{@render viewTabs()}
			{/snippet}
		</DataTable>
	{:else if viewMode === 'awakenings'}
		<!-- Awakenings view -->
		<div class="grid-container">
			<div class="controls">
				{@render viewTabs()}
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
	{:else}
		<!-- Weapon Skills view -->
		<div class="grid-container">
			<div class="controls">
				{@render viewTabs()}
				<div class="controls-right">
					<input
						type="text"
						placeholder="Search skill families..."
						bind:value={skillsSearchTerm}
						class="skills-search"
					/>
					<select bind:value={skillsSeriesFilter} class="filter-select">
						<option value="">All series</option>
						<option value="normal">Normal</option>
						<option value="omega">Omega</option>
						<option value="ex">EX</option>
						<option value="odious">Odious</option>
					</select>
					<select bind:value={skillsSizeFilter} class="filter-select">
						<option value="">All sizes</option>
						{#each ['small', 'medium', 'big', 'big2', 'massive', 'ancestral'] as size (size)}
							<option value={size}>{size}</option>
						{/each}
					</select>
					<select bind:value={skillsBoostTypeFilter} class="filter-select">
						<option value="">All boost types</option>
						{#each skillsBoostTypeOptions as bt (bt)}
							<option value={bt}>{getBoostTypeLabel(bt)}</option>
						{/each}
					</select>
				</div>
			</div>

			{#if editedSkillFamiliesCount > 0}
				<div class="export-reminder">
					{editedSkillFamiliesCount}
					{editedSkillFamiliesCount === 1 ? 'family carries' : 'families carry'} manual edits — run
					<code>rake granblue:export_weapon_skill_data</code> /
					<code>granblue:export_weapon_skill_effects</code> to snapshot them.
				</div>
			{/if}

			{#if weaponSkillFamiliesQuery.isPending}
				<div class="loading-state">Loading skill families...</div>
			{:else if weaponSkillFamiliesQuery.error}
				<div class="error-state">Failed to load skill families</div>
			{:else if filteredSkillFamilies.length > 0}
				<div class="grid-wrapper">
					<table class="series-table">
						<thead>
							<tr>
								<th class="col-image">Icon</th>
								<th class="col-name">Family</th>
								<th>Boost Types</th>
								<th>Series</th>
								<th>Sizes</th>
								<th class="col-num">Weapons</th>
								<th class="col-num">Versions</th>
							</tr>
						</thead>
						<tbody>
							{#each filteredSkillFamilies as family (family.modifier)}
								<tr onclick={() => handleSkillFamilyClick(family)} class="clickable">
									<td class="col-image">
										{#if family.iconStems.length > 0}
											<WeaponSkillIcon iconStems={family.iconStems} size={48} />
										{:else}
											<span class="no-image">—</span>
										{/if}
									</td>
									<td class="col-name">
										<div class="family-name-cell">
											<span class="series-name">{family.displayName?.en ?? family.modifier}</span>
											<span class="family-modifier">{family.modifier}</span>
										</div>
									</td>
									<td>{family.boostTypes.map(getBoostTypeLabel).join(', ') || '—'}</td>
									<td>{family.series.join(', ') || '—'}</td>
									<td>{family.sizes.join(', ') || '—'}</td>
									<td class="col-num">{family.counts.weapons}</td>
									<td class="col-num">{family.counts.versions}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>

				<div class="grid-footer">
					<div class="pagination-info">
						Showing {filteredSkillFamilies.length} of {allSkillFamilies.length} skill families
					</div>
				</div>
			{:else}
				<div class="empty-state">No skill families found</div>
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
		display: flex;
		align-items: center;
		gap: spacing.$unit;
		margin-left: auto;
	}

	.skills-search {
		padding: spacing.$unit spacing.$unit-2x;
		border: 1px solid var(--border-subtle);
		border-radius: layout.$card-corner;
		background: var(--input-bg, var(--card-bg));
		color: var(--text-primary);
		font-size: typography.$font-small;
		outline: none;
		width: 200px;

		&:focus {
			border-color: var(--accent-color);
		}

		&::placeholder {
			color: var(--text-tertiary);
		}
	}

	.filter-select {
		padding: spacing.$unit spacing.$unit-2x;
		border: 1px solid var(--border-subtle);
		border-radius: layout.$card-corner;
		background: var(--input-bg, var(--card-bg));
		color: var(--text-primary);
		font-size: typography.$font-small;
	}

	.export-reminder {
		padding: spacing.$unit spacing.$unit-2x;
		background: var(--notice-yellow-bg, rgba(224, 138, 0, 0.1));
		color: var(--text-secondary);
		font-size: typography.$font-small;
		border-bottom: 1px solid var(--border-subtle);

		code {
			font-size: typography.$font-tiny;
		}
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

		.col-image {
			width: 60px;
			text-align: center;
		}

		.col-type {
			width: 100px;
		}

		.col-num {
			text-align: right;
			font-variant-numeric: tabular-nums;
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

	.family-name-cell {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.family-modifier {
		font-family: monospace;
		font-size: typography.$font-tiny;
		color: var(--text-tertiary);
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
