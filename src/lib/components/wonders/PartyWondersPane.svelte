<script lang="ts">
	/**
	 * PartyWondersPane - a team's Wonders that apply to it, each with its
	 * level and effect under its name. A chevron shows or hides a Wonder's
	 * bonus rows (collapsed by default). Editors get Edit, which pushes
	 * EditWondersPane on top.
	 */
	import { onMount } from 'svelte'
	import { createQuery } from '@tanstack/svelte-query'
	import { m } from '$lib/paraglide/messages'
	import WonderImage from './WonderImage.svelte'
	import WonderBonusList from './WonderBonusList.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import Tooltip from '$lib/components/ui/Tooltip.svelte'
	import { sidebar } from '$lib/stores/sidebar.svelte'
	import { wonderQueries } from '$lib/api/queries/wonder.queries'
	import { visiblePartyWonders } from '$lib/features/wonders/wonders'
	import { wonderEffectTexts, wonderSummary, wonderText } from '$lib/features/wonders/labels'
	import { openEditWondersPane } from './openPartyWonderPanes'
	import type { Party } from '$lib/types/api/party'

	interface Props {
		/** Reads the party page's party, so the pane follows its updates. */
		getParty: () => Party
		canEdit: boolean
		paneId?: string
	}

	let { getParty, canEdit, paneId }: Props = $props()

	const party = $derived(getParty())
	const catalogueQuery = createQuery(() => wonderQueries.catalogue())

	const visible = $derived(
		catalogueQuery.data ? visiblePartyWonders(party, catalogueQuery.data) : []
	)
	const canWrite = $derived(canEdit && party.id !== 'new')

	// Which Wonders have their bonus rows open; all start collapsed
	let expanded = $state<Record<string, boolean>>({})

	function toggleBonuses(id: string) {
		expanded = { ...expanded, [id]: !expanded[id] }
	}

	function openEdit() {
		openEditWondersPane(getParty)
	}

	onMount(() => {
		if (!canWrite) return
		if (paneId) sidebar.setActionForPane(paneId, openEdit, m.action_edit())
		else sidebar.setAction(openEdit, m.action_edit())
	})
</script>

<div class="party-wonders">
	{#if catalogueQuery.data && visible.length === 0}
		<p class="empty-state">{m.wonders_party_none()}</p>
	{/if}

	{#each visible as { wonder, row } (row.id)}
		<!-- Symbolum's strength is already its bonus row; Seals and Yupei show their level -->
		{@const summary = wonder.kind === 'scaling' ? null : wonderSummary(wonder, row)}
		{@const effects = wonderEffectTexts(wonder)}
		<section class="wonder">
			<div class="wonder-header">
				<WonderImage image={row.image} size={64} />
				<div class="wonder-name">
					<h3 class="name">{wonderText(wonder.name)}</h3>
					{#if summary}
						<span class="summary">{summary}</span>
					{/if}
					{#each effects as effect, i (i)}
						<span class="effect">{effect}</span>
					{/each}
				</div>
				{#if row.bonuses.length > 0}
					{@const open = !!expanded[row.id]}
					{@const label = open ? m.wonders_hide_bonuses() : m.wonders_show_bonuses()}
					<Tooltip content={label}>
						<Button
							variant="ghost"
							size="small"
							iconOnly
							aria-label={label}
							aria-expanded={open}
							onclick={() => toggleBonuses(row.id)}
						>
							<Icon name={open ? 'chevron-up' : 'chevron-down'} size={14} />
						</Button>
					</Tooltip>
				{/if}
			</div>
			{#if expanded[row.id] && row.bonuses.length > 0}
				<div class="bonuses">
					<WonderBonusList bonuses={row.bonuses} />
				</div>
			{/if}
		</section>
	{/each}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;

	.party-wonders {
		display: flex;
		flex-direction: column;
		gap: $unit-4x;
		padding: $unit-2x 0;
	}

	.empty-state {
		margin: 0;
		padding: 0 $unit-2x;
		font-size: $font-regular;
		color: var(--text-tertiary);
	}

	.wonder {
		display: flex;
		flex-direction: column;
		gap: $unit-2x;
	}

	.wonder-header {
		display: flex;
		align-items: center;
		gap: calc($unit * 1.5);
		padding: 0 $unit-2x;
	}

	.wonder-name {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: $unit-half;
		min-width: 0;
	}

	.name {
		margin: 0;
		font-size: $font-regular;
		font-weight: $medium;
		color: var(--text-primary);
	}

	// The inset DetailsSection gave the rows when they had a heading
	.bonuses {
		padding: 0 $unit;
	}

	.summary,
	.effect {
		font-size: $font-small;
		color: var(--text-secondary);
	}
</style>
