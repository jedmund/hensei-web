<script lang="ts">
	import { createQuery, useQueryClient } from '@tanstack/svelte-query'
	import { entityAdapter } from '$lib/api/adapters/entity.adapter'
	import { entityQueries } from '$lib/api/queries/entity.queries'
	import { ApiError } from '$lib/api/adapters/errors'
	import PageMeta from '$lib/components/PageMeta.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import SegmentedControl from '$lib/components/ui/segmented-control/SegmentedControl.svelte'
	import Segment from '$lib/components/ui/segmented-control/Segment.svelte'
	import Select from '$lib/components/ui/Select.svelte'
	import DatabasePageHeader from '$lib/components/database/DatabasePageHeader.svelte'
	import NotFoundPlaceholder from '$lib/components/database/NotFoundPlaceholder.svelte'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import RarityPicker from '$lib/components/ui/rarity-picker/RarityPicker.svelte'
	import ElementPicker from '$lib/components/ui/element-picker/ElementPicker.svelte'
	import ProficiencyPicker from '$lib/components/ui/proficiency-picker/ProficiencyPicker.svelte'
	import FamilyDataTab from '$lib/features/database/weapon-skills/FamilyDataTab.svelte'
	import FamilyEffectsTab from '$lib/features/database/weapon-skills/FamilyEffectsTab.svelte'
	import FamilyVersionsTab from '$lib/features/database/weapon-skills/FamilyVersionsTab.svelte'
	import FamilyKeysTab from '$lib/features/database/weapon-skills/FamilyKeysTab.svelte'
	import { getWeaponImage } from '$lib/utils/images'
	import { localizedName } from '$lib/utils/locale'
	import { getBoostTypeLabel } from '$lib/utils/boostType'
	import { titleCase } from '$lib/utils/textCase'
	import WeaponSkillIcon from '$lib/components/database/WeaponSkillIcon.svelte'
	import * as m from '$lib/paraglide/messages'
	import type { DeleteImpact, PanelValidation } from '$lib/types/api/weaponSkillFamily'

	let { data } = $props()

	const queryClient = useQueryClient()
	const modifier = $derived(data.modifier ?? '')
	const canEdit = $derived((data.role || 0) >= 7)

	const familyQuery = createQuery(() => ({
		queryKey: ['weaponSkillFamily', data.modifier],
		queryFn: () => entityAdapter.getWeaponSkillFamily(data.modifier ?? '')
	}))
	const family = $derived(familyQuery.data)

	// Distinct weapons carrying this family, keyed by granblue id.
	const uniqueCarriedByWeapons = $derived.by(() => {
		if (!family) return []
		const byGranblueId = new Map(
			family.versions.filter((v) => v.weapon).map((v) => [v.weapon!.granblueId, v.weapon!])
		)
		return [...byGranblueId.values()]
	})

	// --- Carried-by filters + sort (mirrors the weapon search pane) ---
	// Default to SSR (rarity 3) since that's the overwhelmingly common case.
	let carriedElementFilters = $state<number[]>([])
	let carriedRarityFilters = $state<number[]>([3])
	let carriedProficiencyFilters = $state<number[]>([])
	let carriedSeriesFilter = $state<string | undefined>(undefined)

	// Picker components emit number | number[] depending on `multiple`; we always want an array.
	function toNumberArray(value: number | number[]): number[] {
		return Array.isArray(value) ? value : value != null ? [value] : []
	}

	// Dedupe a raw list and map each entry through a label transform (for pill rendering).
	function uniqueLabels(
		values: (string | null | undefined)[],
		transform: (v: string) => string
	): string[] {
		return [...new Set(values.filter((v): v is string => !!v))].map(transform)
	}

	const boostTypeLabels = $derived(
		family
			? uniqueLabels(
					[...family.data, ...family.effects].map((r) => r.boostType),
					getBoostTypeLabel
				)
			: []
	)
	const seriesLabels = $derived(
		family
			? uniqueLabels(
					family.data.map((r) => r.series),
					titleCase
				)
			: []
	)
	const sizeLabels = $derived(
		family
			? uniqueLabels(
					family.data.map((r) => r.size),
					titleCase
				)
			: []
	)

	type CarriedSort =
		| 'name_asc'
		| 'name_desc'
		| 'element_asc'
		| 'element_desc'
		| 'proficiency_asc'
		| 'proficiency_desc'
		| 'release_date_desc'
		| 'release_date_asc'
	let carriedSort = $state<CarriedSort>('name_asc')

	const carriedSortOptions = $derived([
		{ value: 'name_asc', label: m.sort_name_asc() },
		{ value: 'name_desc', label: m.sort_name_desc() },
		{ value: 'element_asc', label: m.sort_element_asc() },
		{ value: 'element_desc', label: m.sort_element_desc() },
		{ value: 'proficiency_asc', label: m.sort_proficiency_asc() },
		{ value: 'proficiency_desc', label: m.sort_proficiency_desc() },
		{ value: 'release_date_asc', label: m.sort_release_date_oldest() },
		{ value: 'release_date_desc', label: m.sort_release_date_newest() }
	] as { value: CarriedSort; label: string }[])

	const weaponSeriesQuery = createQuery(() => entityQueries.weaponSeriesList())
	const carriedSeriesOptions = $derived.by(() => {
		const list = weaponSeriesQuery.data
		if (!list) return []
		return [...list]
			.sort((a, b) => a.order - b.order)
			.map((s) => ({ value: s.id, label: localizedName(s.name) }))
	})

	const carriedByWeapons = $derived.by(() => {
		let weapons = uniqueCarriedByWeapons
		if (carriedElementFilters.length > 0) {
			weapons = weapons.filter(
				(w) => w.element != null && carriedElementFilters.includes(w.element)
			)
		}
		if (carriedRarityFilters.length > 0) {
			weapons = weapons.filter((w) => w.rarity != null && carriedRarityFilters.includes(w.rarity))
		}
		if (carriedProficiencyFilters.length > 0) {
			weapons = weapons.filter(
				(w) => w.proficiency != null && carriedProficiencyFilters.includes(w.proficiency)
			)
		}
		if (carriedSeriesFilter) {
			weapons = weapons.filter((w) => w.weaponSeriesId === carriedSeriesFilter)
		}

		const dir = carriedSort.endsWith('_desc') ? -1 : 1
		const key = carriedSort.replace(/_(asc|desc)$/, '')
		return [...weapons].sort((a, b) => {
			let cmp: number
			if (key === 'element') cmp = (a.element ?? 0) - (b.element ?? 0)
			else if (key === 'proficiency') cmp = (a.proficiency ?? 0) - (b.proficiency ?? 0)
			else if (key === 'release_date') {
				// Missing dates always sort last, regardless of direction (mirrors NULLS LAST).
				const da = a.latestDate ?? ''
				const db = b.latestDate ?? ''
				if (!da && !db) cmp = 0
				else if (!da) return 1
				else if (!db) return -1
				else cmp = da.localeCompare(db)
			} else cmp = a.nameEn.localeCompare(b.nameEn)
			// Name stays the primary key for the name sort; otherwise it's an
			// always-ascending tiebreak that the primary direction must not flip.
			if (key === 'name') return cmp * dir
			return cmp !== 0 ? cmp * dir : a.nameEn.localeCompare(b.nameEn)
		})
	})

	type Tab = 'overview' | 'data' | 'effects' | 'versions' | 'keys'
	let currentTab = $state<Tab>('overview')

	// --- Calculator-impact tracking: any data/effect mutation arms the banner
	let dirty = $state(false)
	let validating = $state(false)
	let validation = $state<PanelValidation | null>(null)

	async function afterMutation() {
		dirty = true
		validation = null
		await queryClient.invalidateQueries({ queryKey: ['weaponSkillFamily', data.modifier] })
		await queryClient.invalidateQueries({ queryKey: ['weaponSkillFamilies'] })
	}

	async function runValidation() {
		validating = true
		try {
			validation = await entityAdapter.validatePanels()
			if (validation.ok) dirty = false
		} finally {
			validating = false
		}
	}

	/** Guarded delete helper shared by the tabs: 409 → confirm with blast radius */
	async function guardedDelete(
		doDelete: (force: boolean) => Promise<DeleteImpact>
	): Promise<boolean> {
		try {
			await doDelete(false)
			await afterMutation()
			return true
		} catch (err) {
			if (err instanceof ApiError && err.status === 409) {
				const impact = err.details as DeleteImpact
				const samples = impact.sampleWeapons?.join(', ') || 'none'
				const message =
					`This row affects ${impact.affectedVersions} skill version(s) on ` +
					`${impact.affectedWeapons} weapon(s) (${samples}). Delete anyway?`
				if (confirm(message)) {
					await doDelete(true)
					await afterMutation()
					return true
				}
				return false
			}
			throw err
		}
	}
</script>

<PageMeta title={family?.displayName?.en ?? modifier} description="Weapon skill family" />

{#snippet pills(labels: string[])}
	{#if labels.length > 0}
		<div class="pill-list">
			{#each labels as label (label)}
				<span class="pill">{label}</span>
			{/each}
		</div>
	{:else}
		<span class="empty-value">—</span>
	{/if}
{/snippet}

<div class="page">
	<DatabasePageHeader title="Weapon Skill Family">
		{#snippet leftAction()}
			<Button
				variant="ghost"
				size="small"
				leftIcon="chevron-left"
				href="/database/weapons?view=skills"
			>
				Back
			</Button>
		{/snippet}
	</DatabasePageHeader>

	{#if familyQuery.isLoading}
		<div class="state">Loading skill family...</div>
	{:else if familyQuery.isError || !family}
		<NotFoundPlaceholder
			title="Skill Family Not Found"
			message="No weapon skill data exists for this modifier."
			backHref="/database/weapons?view=skills"
			backLabel="Back to Weapon Skills"
		/>
	{:else}
		<header class="family-header">
			<div class="image">
				{#if family.iconStems.length > 0}
					<WeaponSkillIcon iconStems={family.iconStems} size={64} />
				{:else}
					<div class="image-placeholder"></div>
				{/if}
			</div>
			<div class="info">
				<h2>{family.displayName?.en ?? family.modifier}</h2>
				<div class="meta">
					<span class="usage">
						{family.usage.weaponCount} weapon{family.usage.weaponCount === 1 ? '' : 's'} ·
						{family.usage.versionCount} version{family.usage.versionCount === 1 ? '' : 's'}
					</span>
				</div>
			</div>
		</header>

		{#if dirty}
			<div class="validation-banner" class:failed={validation && !validation.ok}>
				<span>
					{#if validation && !validation.ok}
						Golden panel validation FAILED — review the mismatches below or revert the edit.
					{:else}
						Calculator inputs changed — validate the golden panels before moving on.
					{/if}
				</span>
				<Button variant="secondary" size="small" onclick={runValidation} disabled={validating}>
					{validating ? 'Validating…' : 'Run validation'}
				</Button>
			</div>
			{#if validation}
				<div class="validation-results">
					{#each validation.panels as panel (panel.party)}
						<div class="panel-result" class:ok={panel.ok}>
							<strong>{panel.party}</strong>
							{panel.ok ? 'ok' : ''}
							{#each panel.mismatches as m (m.label)}
								<span class="mismatch">{m.label}: {m.ours ?? '—'} vs {m.expected}</span>
							{/each}
						</div>
					{/each}
				</div>
			{/if}
		{/if}

		<div class="tab-navigation">
			<SegmentedControl value={currentTab} onValueChange={(v) => (currentTab = v as Tab)}>
				<Segment value="overview">Overview</Segment>
				<Segment value="data">Scaling Data</Segment>
				<Segment value="effects">Effects</Segment>
				<Segment value="versions">Versions</Segment>
				{#if family.keys.length > 0}
					<Segment value="keys">Keys</Segment>
				{/if}
			</SegmentedControl>
		</div>

		<div class="tab-content" class:flush={currentTab === 'overview'}>
			{#if currentTab === 'overview'}
				<section class="details">
					<DetailsContainer title="Skill Family">
						<DetailItem label="Boost types">{@render pills(boostTypeLabels)}</DetailItem>
						<DetailItem label="Series">{@render pills(seriesLabels)}</DetailItem>
						<DetailItem label="Sizes">{@render pills(sizeLabels)}</DetailItem>
					</DetailsContainer>

					{#if uniqueCarriedByWeapons.length > 0}
						<DetailsContainer title="Carried by">
							{#if uniqueCarriedByWeapons.length > 1}
								<div class="carried-by-controls">
									<div class="filter-row">
										<div class="filter-group">
											<span class="filter-label">Rarity</span>
											<RarityPicker
												value={carriedRarityFilters}
												onValueChange={(v) => (carriedRarityFilters = toNumberArray(v))}
												multiple
												contained
												size="small"
											/>
										</div>
										<div class="filter-group">
											<span class="filter-label">Element</span>
											<ElementPicker
												value={carriedElementFilters}
												onValueChange={(v) => (carriedElementFilters = toNumberArray(v))}
												multiple
												includeAny
												contained
												size="small"
											/>
										</div>
										<div class="filter-group">
											<span class="filter-label">Proficiency</span>
											<ProficiencyPicker
												value={carriedProficiencyFilters}
												onValueChange={(v) => (carriedProficiencyFilters = toNumberArray(v))}
												multiple
												contained
												size="small"
											/>
										</div>
									</div>
									<div class="filter-bottom-row">
										<div class="filter-group series">
											<span class="filter-label">Series</span>
											<Select
												options={carriedSeriesOptions}
												value={carriedSeriesFilter}
												onValueChange={(v) => (carriedSeriesFilter = v)}
												placeholder="All series"
												contained
												fullWidth
											/>
										</div>
										<div class="filter-group sort">
											<span class="filter-label">Sort</span>
											<Select
												options={carriedSortOptions}
												bind:value={carriedSort}
												contained
												fullWidth
											/>
										</div>
									</div>
								</div>
							{/if}

							{#if carriedByWeapons.length > 0}
								<div class="carried-by-list">
									{#each carriedByWeapons as weapon (weapon.granblueId)}
										<a href={`/database/weapons/${weapon.granblueId}`} class="carried-by-row">
											<img
												src={getWeaponImage(
													weapon.granblueId,
													'square',
													weapon.element === 0 ? 0 : undefined
												)}
												alt=""
												class="carried-by-image"
											/>
											<span class="carried-by-name">{weapon.nameEn}</span>
										</a>
									{/each}
								</div>
							{:else}
								<p class="carried-by-empty">No weapons match the current filters.</p>
							{/if}
						</DetailsContainer>
					{/if}
				</section>
			{:else if currentTab === 'data'}
				<FamilyDataTab {family} {canEdit} onMutated={afterMutation} onDelete={guardedDelete} />
			{:else if currentTab === 'effects'}
				<FamilyEffectsTab {family} {canEdit} onMutated={afterMutation} onDelete={guardedDelete} />
			{:else if currentTab === 'versions'}
				<FamilyVersionsTab {family} {canEdit} onMutated={afterMutation} />
			{:else if currentTab === 'keys'}
				<FamilyKeysTab {family} {canEdit} onMutated={afterMutation} />
			{/if}
		</div>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/database' as database;
	@use '$src/themes/effects' as effects;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.page {
		background: var(--card-bg);
		border-radius: layout.$page-corner;
		box-shadow: var(--shadow-sm);
	}

	.state {
		text-align: center;
		padding: spacing.$unit * 4;
		color: var(--text-secondary);
	}

	.family-header {
		display: flex;
		align-items: center;
		gap: spacing.$unit-2x;
		padding: 0 spacing.$unit-2x spacing.$unit-2x;

		.image {
			flex-shrink: 0;

			.image-placeholder {
				width: 64px;
				height: 64px;
				border-radius: layout.$item-corner;
				background: var(--background);
			}
		}

		.info {
			flex: 1;
			min-width: 0;

			h2 {
				font-size: typography.$font-xlarge;
				font-weight: typography.$bold;
				margin: 0 0 spacing.$unit 0;
				color: var(--text-primary);
			}

			.meta {
				display: flex;
				flex-wrap: wrap;
				align-items: center;
				gap: spacing.$unit;
				font-size: typography.$font-small;
				color: var(--text-secondary);
			}
		}
	}

	.validation-banner {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: spacing.$unit;
		margin: 0 spacing.$unit-2x spacing.$unit-2x;
		padding: spacing.$unit spacing.$unit-2x;
		border-radius: layout.$item-corner;
		background: var(--notice-yellow-bg, rgba(224, 138, 0, 0.12));
		color: var(--text-primary);
		font-size: typography.$font-small;

		&.failed {
			background: var(--notice-red-bg, rgba(220, 60, 60, 0.12));
		}
	}

	.validation-results {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-half;
		margin: 0 spacing.$unit-2x spacing.$unit-2x;
		font-size: typography.$font-small;

		.panel-result {
			display: flex;
			flex-wrap: wrap;
			gap: spacing.$unit;
			color: var(--text-secondary);

			&.ok strong {
				color: var(--text-tertiary);
			}
		}

		.mismatch {
			color: var(--red);
			font-variant-numeric: tabular-nums;
		}
	}

	.tab-navigation {
		padding: 0 spacing.$unit-2x spacing.$unit-2x;
	}

	.tab-content {
		border-top: 1px solid var(--border-subtle);
		padding: spacing.$unit-2x;

		// The Overview tab is a stack of DetailsContainers that already carry their own
		// padding and full-width dividers (matching the shared entity Info tabs), so the
		// wrapper must not add a second layer of padding.
		&.flush {
			padding: 0;
		}
	}

	.details {
		@include database.details;
	}

	.pill-list {
		display: flex;
		flex-wrap: wrap;
		gap: spacing.$unit-half;
		justify-content: flex-end;
	}

	.pill {
		display: inline-block;
		padding: 2px spacing.$unit;
		border-radius: layout.$full-corner;
		background: var(--background);
		color: var(--text-secondary);
		font-size: typography.$font-small;
		white-space: nowrap;
	}

	.empty-value {
		color: var(--text-secondary);
	}

	.carried-by-controls {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-2x;
		margin-bottom: spacing.$unit-2x;

		.filter-row {
			display: flex;
			flex-wrap: wrap;
			gap: spacing.$unit-2x;
		}

		.filter-bottom-row {
			display: flex;
			flex-wrap: wrap;
			align-items: flex-end;
			gap: spacing.$unit-2x;
		}

		.filter-group {
			display: flex;
			flex-direction: column;
			gap: spacing.$unit;
			min-width: 0;

			&.series {
				flex: 2;
				min-width: 200px;
			}

			&.sort {
				flex: 1;
				min-width: 180px;
			}
		}

		.filter-label {
			font-size: typography.$font-small;
			font-weight: typography.$bold;
			color: var(--text-secondary);
			padding: 0 spacing.$unit-half;
		}
	}

	.carried-by-empty {
		color: var(--text-tertiary);
		font-size: typography.$font-small;
		margin: 0;
		padding: spacing.$unit 0;
	}

	.carried-by-row {
		display: flex;
		align-items: center;
		gap: spacing.$unit;
		padding: spacing.$unit-half spacing.$unit;
		margin: 0 calc(spacing.$unit * -1);
		border-radius: layout.$item-corner;
		color: var(--text-primary);
		text-decoration: none;
		@include effects.smooth-transition(effects.$duration-quick, background-color);

		&:hover {
			background: var(--background);
		}
	}

	.carried-by-image {
		width: 40px;
		height: 40px;
		object-fit: contain;
		border-radius: layout.$item-corner-small;
		flex-shrink: 0;
	}

	.carried-by-name {
		font-size: typography.$font-small;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
