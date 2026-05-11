<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query'
	import PageMeta from '$lib/components/PageMeta.svelte'
	import DatabasePageHeader from '$lib/components/database/DatabasePageHeader.svelte'
	import SegmentedControl from '$lib/components/ui/segmented-control/SegmentedControl.svelte'
	import Segment from '$lib/components/ui/segmented-control/Segment.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import * as m from '$lib/paraglide/messages'
	import { difficultyQueries } from '$lib/api/queries/difficulty.queries'
	import type { DifficultyTier } from '$lib/types/api/party'
	import type { DifficultyRule } from '$lib/api/adapters/difficulty.adapter'
	import TierRow from '$lib/features/database/difficulties/TierRow.svelte'
	import TierModal from '$lib/features/database/difficulties/TierModal.svelte'
	import RuleRow from '$lib/features/database/difficulties/RuleRow.svelte'
	import RuleModal from '$lib/features/database/difficulties/RuleModal.svelte'
	import ComponentsPanel from '$lib/features/database/difficulties/ComponentsPanel.svelte'
	import PreviewPanel from '$lib/features/database/difficulties/PreviewPanel.svelte'
	import { getDifficultyComponentOptions } from '$lib/features/database/difficulties/constants'

	type Tab = 'tiers' | 'rules' | 'components' | 'preview'

	let activeTab = $state<Tab>('tiers')

	const tiersQuery = createQuery(() => difficultyQueries.tiers())
	const rulesQuery = createQuery(() => difficultyQueries.rules())

	const tiers = $derived(tiersQuery.data ?? [])
	const rules = $derived(rulesQuery.data ?? [])

	// Modal state
	let tierModalOpen = $state(false)
	let editingTier = $state<DifficultyTier | null>(null)
	let ruleModalOpen = $state(false)
	let editingRule = $state<DifficultyRule | null>(null)

	function openNewTier() {
		editingTier = null
		tierModalOpen = true
	}

	function openEditTier(tier: DifficultyTier) {
		editingTier = tier
		tierModalOpen = true
	}

	function openNewRule() {
		editingRule = null
		ruleModalOpen = true
	}

	function openEditRule(rule: DifficultyRule) {
		editingRule = rule
		ruleModalOpen = true
	}

	// Filter chips for the rules list
	let ruleComponentFilter = $state<string>('all')
	const filteredRules = $derived(
		ruleComponentFilter === 'all' ? rules : rules.filter((r) => r.component === ruleComponentFilter)
	)
	const componentFilters = $derived([
		{ value: 'all', label: m.difficulty_component_all() },
		...getDifficultyComponentOptions()
	])
</script>

<PageMeta
	title="Difficulties — Database"
	description="Manage party difficulty tiers, rules, and components."
/>

<div class="page">
	<DatabasePageHeader title={m.party_difficulty_label()}>
		{#snippet leftAction()}
			<Button variant="ghost" size="small" leftIcon="chevron-left" href="/database">Back</Button>
		{/snippet}
	</DatabasePageHeader>

	<div class="tab-bar">
		<SegmentedControl bind:value={activeTab} size="small" variant="background">
			<Segment value="tiers">Tiers</Segment>
			<Segment value="rules">Rules</Segment>
			<Segment value="components">Components</Segment>
			<Segment value="preview">Preview</Segment>
		</SegmentedControl>
	</div>

	<div class="content">
		{#if activeTab === 'tiers'}
			<section class="section">
				<header class="section-header">
					<div>
						<h2>Tiers</h2>
						<p class="section-hint">Score ranges that label each party.</p>
					</div>
					<Button variant="ghost" size="small" leftIcon="plus" onclick={openNewTier}>
						New tier
					</Button>
				</header>
				{#if tiersQuery.isLoading}
					<p class="empty">Loading tiers…</p>
				{:else if tiers.length === 0}
					<div class="empty-state">
						<p>No tiers yet.</p>
						<Button variant="primary" size="small" onclick={openNewTier}>
							Create the first tier
						</Button>
					</div>
				{:else}
					<div class="rows">
						{#each tiers as tier (tier.id)}
							<TierRow {tier} onclick={() => openEditTier(tier)} />
						{/each}
					</div>
				{/if}
			</section>
		{:else if activeTab === 'rules'}
			<section class="section">
				<header class="section-header">
					<div>
						<h2>Rules</h2>
						<p class="section-hint">
							Each rule contributes its weight to its component when its condition fires.
						</p>
					</div>
					<Button variant="ghost" size="small" leftIcon="plus" onclick={openNewRule}>
						New rule
					</Button>
				</header>

				<div class="filter-bar">
					<SegmentedControl bind:value={ruleComponentFilter} size="xsmall" variant="background">
						{#each componentFilters as f (f.value)}
							<Segment value={f.value}>{f.label}</Segment>
						{/each}
					</SegmentedControl>
					<span class="filter-count">
						{filteredRules.length} rule{filteredRules.length === 1 ? '' : 's'}
					</span>
				</div>

				{#if rulesQuery.isLoading}
					<p class="empty">Loading rules…</p>
				{:else if filteredRules.length === 0}
					<div class="empty-state">
						<p>No rules match this filter.</p>
					</div>
				{:else}
					<div class="rows">
						{#each filteredRules as rule (rule.id)}
							<RuleRow {rule} onclick={() => openEditRule(rule)} />
						{/each}
					</div>
				{/if}
			</section>
		{:else if activeTab === 'components'}
			<section class="section">
				<header class="section-header">
					<div>
						<h2>Components</h2>
						<p class="section-hint">
							Per-component weight, scoreability threshold, and on/off switch. Components are
							seeded; you can tune their values but cannot create or destroy them.
						</p>
					</div>
				</header>
				<ComponentsPanel />
			</section>
		{:else}
			<section class="section">
				<header class="section-header">
					<div>
						<h2>Preview</h2>
						<p class="section-hint">Test the current ruleset against any party by shortcode.</p>
					</div>
				</header>
				<PreviewPanel />
			</section>
		{/if}
	</div>
</div>

<TierModal bind:open={tierModalOpen} tier={editingTier} />
<RuleModal bind:open={ruleModalOpen} rule={editingRule} />

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.page {
		background: var(--card-bg);
		border-radius: layout.$page-corner;
		box-shadow: var(--shadow-sm);
	}

	.tab-bar {
		display: flex;
		justify-content: center;
		padding: 0 spacing.$unit-2x spacing.$unit-2x;
	}

	.content {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-2x;
		padding: 0 spacing.$unit-2x spacing.$unit-2x;
	}

	.section {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-2x;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: spacing.$unit;

		h2 {
			margin: 0;
			font-size: typography.$font-medium;
			font-weight: typography.$bold;
			color: var(--text-primary);
		}
	}

	.section-hint {
		margin: spacing.$unit-half 0 0 0;
		color: var(--text-secondary);
		font-size: typography.$font-small;
		max-width: 60ch;
	}

	.filter-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: spacing.$unit;
	}

	.filter-count {
		font-size: typography.$font-small;
		color: var(--text-tertiary);
	}

	.rows {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-half;
	}

	.empty {
		color: var(--text-secondary);
		text-align: center;
		padding: spacing.$unit-4x;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: spacing.$unit-2x;
		padding: spacing.$unit-4x;
		color: var(--text-secondary);

		p {
			margin: 0;
		}
	}
</style>
