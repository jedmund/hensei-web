<script lang="ts">
	import { onMount } from 'svelte'
	import { goto } from '$app/navigation'
	import { page } from '$app/stores'
	import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query'
	import { toast } from 'svelte-sonner'
	import PageMeta from '$lib/components/PageMeta.svelte'
	import DatabasePageHeader from '$lib/components/database/DatabasePageHeader.svelte'
	import SegmentedControl from '$lib/components/ui/segmented-control/SegmentedControl.svelte'
	import Segment from '$lib/components/ui/segmented-control/Segment.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte'
	import * as m from '$lib/paraglide/messages'
	import { difficultyAdapter } from '$lib/api/adapters/difficulty.adapter'
	import { difficultyQueries } from '$lib/api/queries/difficulty.queries'
	import { extractErrorMessage } from '$lib/utils/errors'
	import type { DifficultyTier } from '$lib/types/api/party'
	import type { DifficultyRule } from '$lib/api/adapters/difficulty.adapter'
	import TierRow from '$lib/features/database/difficulties/TierRow.svelte'
	import TierModal from '$lib/features/database/difficulties/TierModal.svelte'
	import RuleRow from '$lib/features/database/difficulties/RuleRow.svelte'
	import RuleModal from '$lib/features/database/difficulties/RuleModal.svelte'
	import ComponentsPanel from '$lib/features/database/difficulties/ComponentsPanel.svelte'
	import PreviewPanel from '$lib/features/database/difficulties/PreviewPanel.svelte'
	import CommitDialog from '$lib/features/database/difficulties/CommitDialog.svelte'
	import Notice from '$lib/components/ui/Notice.svelte'
	import { getDifficultyComponentOptions } from '$lib/features/database/difficulties/constants'

	type Tab = 'tiers' | 'rules' | 'components' | 'preview'

	let activeTab = $state<Tab>('tiers')
	let initialShortcode = $state<string | undefined>(undefined)

	const queryClient = useQueryClient()

	const tiersQuery = createQuery(() => difficultyQueries.tiers({ withDrafts: true }))
	const rulesQuery = createQuery(() => difficultyQueries.rules({ withDrafts: true }))
	const diffQuery = createQuery(() => difficultyQueries.diff())

	const tiers = $derived(tiersQuery.data ?? [])
	const rules = $derived(rulesQuery.data ?? [])
	const pendingCount = $derived(diffQuery.data?.pendingCount ?? 0)
	const diff = $derived(diffQuery.data?.diff ?? null)

	// Modal state
	let tierModalOpen = $state(false)
	let editingTier = $state<DifficultyTier | null>(null)
	let ruleModalOpen = $state(false)
	let editingRule = $state<DifficultyRule | null>(null)
	let commitDialogOpen = $state(false)
	let confirmDiscardOpen = $state(false)

	const discardMut = createMutation(() => ({
		mutationFn: () => difficultyAdapter.discardDrafts()
	}))

	async function handleConfirmDiscard() {
		try {
			const { discarded } = await discardMut.mutateAsync()
			await queryClient.invalidateQueries({ queryKey: ['difficulties'] })
			toast.success(
				discarded === 1 ? 'Discarded 1 pending change' : `Discarded ${discarded} pending changes`
			)
			confirmDiscardOpen = false
		} catch (err) {
			toast.error(extractErrorMessage(err, 'Failed to discard drafts'))
		}
	}

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

	const TABS: Tab[] = ['tiers', 'rules', 'components', 'preview']

	onMount(() => {
		const params = $page.url.searchParams
		const tabParam = params.get('tab')
		if (tabParam && (TABS as string[]).includes(tabParam)) {
			activeTab = tabParam as Tab
		}
		const shortcode = params.get('shortcode')
		if (shortcode) initialShortcode = shortcode
	})

	$effect(() => {
		const next = new URL($page.url)
		// Treat a missing param as the default tab so the effect doesn't loop on first mount.
		const current = next.searchParams.get('tab') ?? 'tiers'
		if (current === activeTab) return
		if (activeTab === 'tiers') next.searchParams.delete('tab')
		else next.searchParams.set('tab', activeTab)
		goto(next.pathname + (next.search || ''), {
			replaceState: true,
			noScroll: true,
			keepFocus: true
		})
	})
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
		{#snippet rightAction()}
			{#if pendingCount > 0}
				<Button
					variant="ghost"
					size="small"
					onclick={() => (confirmDiscardOpen = true)}
					disabled={discardMut.isPending}
				>
					Discard
				</Button>
			{/if}
			<Button
				variant="primary"
				size="small"
				onclick={() => (commitDialogOpen = true)}
				disabled={pendingCount === 0}
			>
				{pendingCount > 0 ? `Commit (${pendingCount})` : 'Commit'}
			</Button>
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
					<Notice variant="gray">
						<p>
							Define score ranges called tiers that sort parties by how difficult they are to
							create.
						</p>
					</Notice>
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
					<div class="section-header-row">
						<div class="section-count">
							<span class="count">{tiers.length} tier{tiers.length === 1 ? '' : 's'}</span>
						</div>
						<Button variant="ghost" contained size="small" leftIcon="plus" onclick={openNewTier}>
							New tier
						</Button>
					</div>
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
					<Notice variant="gray">
						<p>
							Define rules that contribute to the score of each component. Each rule contributes its
							weight to its component when its condition fires.
						</p>
					</Notice>
				</header>

				<div class="filter-bar">
					<SegmentedControl bind:value={ruleComponentFilter} size="xsmall" variant="background">
						{#each componentFilters as f (f.value)}
							<Segment value={f.value}>{f.label}</Segment>
						{/each}
					</SegmentedControl>
				</div>

				{#if rulesQuery.isLoading}
					<p class="empty">Loading rules…</p>
				{:else if filteredRules.length === 0}
					<div class="empty-state">
						<p>No rules match this filter.</p>
					</div>
				{:else}
					<div class="section-header-row">
						<span class="filter-count">
							{filteredRules.length} match{filteredRules.length === 1 ? '' : 'es'}
						</span>
						<Button variant="ghost" contained size="small" leftIcon="plus" onclick={openNewRule}>
							New rule
						</Button>
					</div>
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
					<Notice variant="gray">
						<p>
							Define per-component weight, scoreability threshold, and on/off switch. Components are
							used to score parties and are defined in the API.
						</p>
						<p>
							Components are seeded; you can tune their values but cannot create or destroy them.
						</p>
					</Notice>
				</header>
				<ComponentsPanel />
			</section>
		{:else}
			<section class="section">
				<header class="section-header">
					<Notice variant="gray">
						<p>
							Use this tool to test the current ruleset against any party by shortcode. Changes
							won't persist until you Commit them using the button at the top.
						</p>
					</Notice>
				</header>
				<PreviewPanel {initialShortcode} />
			</section>
		{/if}
	</div>
</div>

<TierModal bind:open={tierModalOpen} tier={editingTier} />
<RuleModal bind:open={ruleModalOpen} rule={editingRule} />
<CommitDialog bind:open={commitDialogOpen} {diff} />

<ConfirmDialog
	bind:open={confirmDiscardOpen}
	title="Discard pending changes?"
	message={pendingCount === 1
		? '1 pending change will be discarded. This cannot be undone.'
		: `${pendingCount} pending changes will be discarded. This cannot be undone.`}
	confirmLabel="Discard"
	loading={discardMut.isPending}
	onconfirm={handleConfirmDiscard}
/>

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
		flex-direction: column;
		gap: spacing.$unit;

		h2 {
			margin: 0;
			font-size: typography.$font-medium;
			font-weight: typography.$bold;
			color: var(--text-primary);
		}
	}

	.section-header-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: spacing.$unit;

		.section-count {
			font-size: typography.$font-regular;
			color: var(--text-secondary);
		}
	}

	.section-hint {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;
		background: var(--notice-bg);
		padding: spacing.$unit-2x;
		border-radius: layout.$card-corner;
		width: 100%;

		p {
			color: var(--notice-text);
			font-size: typography.$font-regular;
			line-height: 1.5;
			margin: 0;
		}
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
