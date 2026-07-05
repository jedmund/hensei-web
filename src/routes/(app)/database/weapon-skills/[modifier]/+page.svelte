<script lang="ts">
	import { createQuery, useQueryClient } from '@tanstack/svelte-query'
	import { entityAdapter } from '$lib/api/adapters/entity.adapter'
	import { ApiError } from '$lib/api/adapters/errors'
	import PageMeta from '$lib/components/PageMeta.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import SegmentedControl from '$lib/components/ui/segmented-control/SegmentedControl.svelte'
	import Segment from '$lib/components/ui/segmented-control/Segment.svelte'
	import NotFoundPlaceholder from '$lib/components/database/NotFoundPlaceholder.svelte'
	import FamilyDataTab from '$lib/features/database/weapon-skills/FamilyDataTab.svelte'
	import FamilyEffectsTab from '$lib/features/database/weapon-skills/FamilyEffectsTab.svelte'
	import FamilyVersionsTab from '$lib/features/database/weapon-skills/FamilyVersionsTab.svelte'
	import FamilyKeysTab from '$lib/features/database/weapon-skills/FamilyKeysTab.svelte'
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

<div class="page">
	{#if familyQuery.isLoading}
		<div class="state">Loading skill family...</div>
	{:else if familyQuery.isError || !family}
		<NotFoundPlaceholder
			title="Skill Family Not Found"
			message="No weapon skill data exists for this modifier."
			backHref="/database/weapon-skills"
			backLabel="Back to Weapon Skills"
		/>
	{:else}
		<header class="header">
			<div class="title">
				<Button variant="ghost" size="small" href="/database/weapon-skills">← Back</Button>
				<div class="names">
					<h1>{family.displayName?.en ?? family.modifier}</h1>
					<span class="modifier">{family.modifier}</span>
				</div>
			</div>
			<div class="usage">
				{family.usage.weaponCount} weapon{family.usage.weaponCount === 1 ? '' : 's'} ·
				{family.usage.versionCount} version{family.usage.versionCount === 1 ? '' : 's'}
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

		<SegmentedControl value={currentTab} onValueChange={(v) => (currentTab = v as Tab)}>
			<Segment value="overview">Overview</Segment>
			<Segment value="data">Scaling Data</Segment>
			<Segment value="effects">Effects</Segment>
			<Segment value="versions">Versions</Segment>
			{#if family.keys.length > 0}
				<Segment value="keys">Keys</Segment>
			{/if}
		</SegmentedControl>

		<div class="tab-content">
			{#if currentTab === 'overview'}
				<section class="overview">
					<div class="summary">
						<dl>
							<dt>Boost types</dt>
							<dd>
								{[...new Set([...family.data, ...family.effects].map((r) => r.boostType))].join(
									', '
								) || '—'}
							</dd>
							<dt>Series</dt>
							<dd>
								{[...new Set(family.data.map((r) => r.series).filter(Boolean))].join(', ') || '—'}
							</dd>
							<dt>Sizes</dt>
							<dd>
								{[...new Set(family.data.map((r) => r.size).filter(Boolean))].join(', ') || '—'}
							</dd>
						</dl>
					</div>
					{#if family.versions.length > 0}
						<h3>Carried by</h3>
						<ul class="weapon-list">
							{#each [...new Map(family.versions
										.filter((v) => v.weapon)
										.map( (v) => [v.weapon!.granblueId, v.weapon!] )).values()] as weapon (weapon.granblueId)}
								<li>
									<a href={`/database/weapons/${weapon.granblueId}`}>{weapon.nameEn}</a>
								</li>
							{/each}
						</ul>
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
	@use '$src/themes/effects' as effects;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.page {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-2x;
		padding: spacing.$unit-2x 0;
		margin: 0 auto;
	}

	.state {
		text-align: center;
		padding: spacing.$unit * 4;
		color: var(--text-secondary);
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: spacing.$unit;

		.title {
			display: flex;
			align-items: center;
			gap: spacing.$unit-2x;
		}

		.names {
			display: flex;
			align-items: baseline;
			gap: spacing.$unit;

			h1 {
				font-size: typography.$font-large;
				margin: 0;
			}

			.modifier {
				font-family: monospace;
				font-size: typography.$font-small;
				color: var(--text-tertiary);
			}
		}

		.usage {
			color: var(--text-secondary);
			font-size: typography.$font-small;
		}
	}

	.validation-banner {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: spacing.$unit;
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
		padding: 0 spacing.$unit-2x;
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

	.tab-content {
		background: var(--card-bg);
		border: 0.5px solid rgba(0, 0, 0, 0.18);
		border-radius: layout.$page-corner;
		box-shadow: effects.$page-elevation;
		padding: spacing.$unit-2x;
	}

	.overview {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-2x;

		dl {
			display: grid;
			grid-template-columns: auto 1fr;
			gap: spacing.$unit-half spacing.$unit-2x;
			margin: 0;

			dt {
				color: var(--text-secondary);
				font-size: typography.$font-small;
			}

			dd {
				margin: 0;
				font-size: typography.$font-small;
			}
		}

		h3 {
			font-size: typography.$font-regular;
			margin: 0;
		}

		.weapon-list {
			list-style: none;
			margin: 0;
			padding: 0;
			display: flex;
			flex-wrap: wrap;
			gap: spacing.$unit;

			a {
				color: var(--link-color, var(--blue));
				font-size: typography.$font-small;
				text-decoration: none;

				&:hover {
					text-decoration: underline;
				}
			}
		}
	}
</style>
