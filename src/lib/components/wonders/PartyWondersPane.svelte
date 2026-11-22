<script lang="ts">
	/**
	 * PartyWondersPane - a team's Wonders that apply to it, each with its
	 * level or bonus, its computed bonuses and its effects. Editors get Edit,
	 * which pushes EditWondersPane on top.
	 */
	import { onMount } from 'svelte'
	import { createQuery } from '@tanstack/svelte-query'
	import { m } from '$lib/paraglide/messages'
	import WonderImage from './WonderImage.svelte'
	import WonderDetails from './WonderDetails.svelte'
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
		{@const summary = wonderSummary(wonder, row)}
		{@const effects = wonderEffectTexts(wonder)}
		<section class="wonder">
			<div class="wonder-header">
				<WonderImage image={row.image} size={56} />
				<div class="wonder-name">
					<h3 class="name">{wonderText(wonder.name)}</h3>
					{#if summary}
						<span class="summary">{summary}</span>
					{/if}
					{#each effects as effect, i (i)}
						<span class="effect">{effect}</span>
					{/each}
				</div>
			</div>
			<WonderDetails {wonder} bonuses={row.bonuses} showDescription={false} showEffects={false} />
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
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.name {
		margin: 0;
		font-size: $font-regular;
		font-weight: $medium;
		color: var(--text-primary);
	}

	.summary,
	.effect {
		font-size: $font-small;
		color: var(--text-secondary);
	}
</style>
