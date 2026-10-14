<script lang="ts">
	/**
	 * SolomonisDetailsPane - the Evoking Solomonis sidebar pane: route Evoker,
	 * zone, pledge, outcome and blessings, plus whatever an imported report
	 * brought (end time, turns, spaces visited, guidebook). Opened from the
	 * raid tile and the team settings pane; Edit pushes EditSolomonisPane on
	 * top of it.
	 */
	import { onMount } from 'svelte'
	import * as m from '$lib/paraglide/messages'
	import { sidebar } from '$lib/stores/sidebar.svelte'
	import GuidebookSection from '$lib/components/solomonis/guidebook/GuidebookSection.svelte'
	import EvokerHeader from './EvokerHeader.svelte'
	import ExpeditionSection from './ExpeditionSection.svelte'
	import BlessingSection from './BlessingSection.svelte'
	import TraversalSection from './TraversalSection.svelte'
	import EconomySection from './EconomySection.svelte'
	import {
		useUpdatePartyBlessings,
		useUpdateSolomonisExpedition
	} from '$lib/api/mutations/solomonis.mutations'
	import type { Party } from '$lib/types/api/party'
	import UnsealPriorityPane from '$lib/components/solomonis/grid/UnsealPriorityPane.svelte'
	import { PRIORITY_TYPES, priorityLists } from '$lib/components/solomonis/grid/seal'
	import { openEditSolomonisPane, showSolomonisPane } from './openSolomonisPanes'
	import {
		hasStats,
		isFullExpedition,
		routeEvokerMissingFromGrid,
		showGuidebookSection
	} from './solomonisParty'

	interface Props {
		/** Reads the party page's party, so the pane follows its updates. */
		getParty: () => Party
		canEdit: boolean
		paneId?: string
	}

	let { getParty, canEdit, paneId }: Props = $props()

	const party = $derived(getParty())

	const mutations = {
		expedition: useUpdateSolomonisExpedition(),
		blessings: useUpdatePartyBlessings(() => party.id)
	}

	const expedition = $derived(isFullExpedition(party.solomonis) ? party.solomonis : null)
	const missingFromGrid = $derived(routeEvokerMissingFromGrid(party))
	const canWrite = $derived(canEdit && party.id !== 'new')

	// Unseal priority link: only when there's something sealed to rank
	const priority = $derived(priorityLists(party))
	const hasSealed = $derived(
		PRIORITY_TYPES.some((type) => priority[type].ranked.length + priority[type].unranked.length > 0)
	)
	const anyRanked = $derived(PRIORITY_TYPES.some((type) => priority[type].ranked.length > 0))

	function openPriorityPane() {
		showSolomonisPane(m.solomonis_web_grid_priority_title(), UnsealPriorityPane, {
			canEdit: canWrite
		})
	}

	function openEditPane() {
		openEditSolomonisPane(party, mutations)
	}

	onMount(() => {
		if (!canWrite) return
		if (paneId) sidebar.setActionForPane(paneId, openEditPane, m.action_edit())
		else sidebar.setAction(openEditPane, m.action_edit())
	})
</script>

<div class="solomonis-details">
	{#if !expedition}
		<p class="empty-state">{canWrite ? m.solomonis_web_party_no_expedition() : '—'}</p>
	{:else}
		<!-- The Evoker and the outcome read as one block -->
		<div class="overview">
			<EvokerHeader {expedition} {missingFromGrid} />

			<ExpeditionSection
				outcome={expedition.outcome}
				turnCount={party.turnCount}
				onOpenPriority={hasSealed ? openPriorityPane : undefined}
				priorityValue={anyRanked ? undefined : m.solomonis_web_grid_priority_unranked()}
			/>
		</div>

		<BlessingSection {expedition} />

		{#if hasStats(expedition.stats)}
			<TraversalSection stats={expedition.stats} />

			<EconomySection stats={expedition.stats} />
		{/if}

		{#if showGuidebookSection(expedition, canWrite)}
			<div class="guidebook">
				<GuidebookSection {party} canEdit={canWrite} />
			</div>
		{/if}
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;

	.solomonis-details {
		display: flex;
		flex-direction: column;
		gap: $unit-4x;
		padding: $unit-2x 0;
	}

	.overview {
		display: flex;
		flex-direction: column;
		gap: $unit-2x;
	}

	.empty-state {
		margin: 0;
		padding: 0 $unit-2x;
		font-size: $font-regular;
		color: var(--text-tertiary);
	}

	.guidebook {
		padding: 0 $unit-2x;
	}
</style>
