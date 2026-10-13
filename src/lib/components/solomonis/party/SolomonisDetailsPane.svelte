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
	import DetailRow from '$lib/components/sidebar/details/DetailRow.svelte'
	import GuidebookSection from '$lib/components/solomonis/guidebook/GuidebookSection.svelte'
	import BlessingSection from './BlessingSection.svelte'
	import TraversalSection from './TraversalSection.svelte'
	import EconomySection from './EconomySection.svelte'
	import { getCharacterImage } from '$lib/utils/images'
	import { appLocale } from '$lib/utils/locale'
	import {
		useUpdatePartyBlessings,
		useUpdateSolomonisExpedition
	} from '$lib/api/mutations/solomonis.mutations'
	import type { Party } from '$lib/types/api/party'
	import type { SolomonisOutcome } from '$lib/types/api/solomonis'
	import { openEditSolomonisPane } from './openSolomonisPanes'
	import {
		hasStats,
		isFullExpedition,
		routeEvokerMissingFromGrid,
		solomonisName
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
		blessings: useUpdatePartyBlessings()
	}

	const locale = appLocale()
	const expedition = $derived(isFullExpedition(party.solomonis) ? party.solomonis : null)
	const missingFromGrid = $derived(routeEvokerMissingFromGrid(party))
	const canWrite = $derived(canEdit && party.id !== 'new')

	const OUTCOME_LABELS: Record<SolomonisOutcome, () => string> = {
		miasma_1: m.solomonis_web_party_outcome_miasma_1,
		miasma_2: m.solomonis_web_party_outcome_miasma_2,
		cleared: m.solomonis_web_party_outcome_cleared
	}

	// "Allotropic Microcosm · Pledge 3", as on the raid tile
	const headerMeta = $derived(
		expedition
			? [
					solomonisName(expedition.zone.name, locale),
					expedition.pledgeLevel > 0
						? m.solomonis_web_party_pledge_short({ level: expedition.pledgeLevel })
						: null
				]
					.filter(Boolean)
					.join(' · ')
			: ''
	)

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
		<div class="evoker">
			<img
				src={getCharacterImage(expedition.routeEvoker.granblueId, 'square')}
				alt=""
				class="evoker-image"
			/>
			<div class="evoker-details">
				<span class="evoker-name">{solomonisName(expedition.routeEvoker.name, locale)}</span>
				<span class="evoker-meta">{headerMeta}</span>
			</div>
		</div>
		{#if missingFromGrid}
			<p class="notice">
				{m.solomonis_web_party_not_in_grid({
					name: solomonisName(expedition.routeEvoker.name, locale)
				})}
			</p>
		{/if}

		<div class="rows expedition-rows">
			<DetailRow label={m.solomonis_web_party_outcome()}>
				<span class="outcome {expedition.outcome ?? 'not-set'}">
					{expedition.outcome
						? OUTCOME_LABELS[expedition.outcome]()
						: m.solomonis_web_party_not_set()}
				</span>
			</DetailRow>
			{#if party.turnCount != null}
				<DetailRow label={m.solomonis_web_party_turns()} value={party.turnCount} />
			{/if}
		</div>

		<hr class="divider" />

		<BlessingSection {expedition} />

		{#if hasStats(expedition.stats)}
			<hr class="divider" />

			<TraversalSection stats={expedition.stats} />

			<hr class="divider" />

			<EconomySection stats={expedition.stats} />
		{/if}

		{#if expedition.guidebook.length > 0}
			<hr class="divider" />

			<div class="guidebook">
				<GuidebookSection {party} canEdit={canWrite} />
			</div>
		{/if}
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;

	.solomonis-details {
		display: flex;
		flex-direction: column;
		gap: $unit-2x;
		padding: $unit-2x 0;
	}

	.empty-state {
		margin: 0;
		padding: 0 $unit-2x;
		font-size: $font-regular;
		color: var(--text-tertiary);
	}

	.evoker {
		display: flex;
		align-items: center;
		gap: $unit;
		padding: 0 $unit-2x;
	}

	.evoker-image {
		width: 48px;
		height: 48px;
		border-radius: $item-corner-small;
	}

	.evoker-details {
		display: flex;
		flex-direction: column;
		gap: $unit-fourth;
	}

	.evoker-name {
		font-size: $font-regular;
		font-weight: $bold;
		color: var(--text-primary);
	}

	.evoker-meta {
		font-size: $font-small;
		color: var(--text-tertiary);
	}

	.notice {
		margin: 0;
		padding: 0 $unit-2x;
		font-size: $font-small;
		color: var(--text-secondary);
	}

	.rows {
		display: flex;
		flex-direction: column;
	}

	// Lined up with the DetailsSection rows below
	.expedition-rows {
		padding: 0 $unit;
	}

	// Cleared in green, the miasma stages in Arcarum purple, Not set muted
	.outcome {
		font-weight: $medium;

		&.cleared {
			color: var(--wind-text);
		}

		&.miasma_1,
		&.miasma_2 {
			color: var(--extra-purple-primary);
		}

		&.not-set {
			color: var(--text-secondary);
		}
	}

	.divider {
		margin: 0;
		border: none;
		border-top: 1px solid var(--border-subtle);
	}

	.guidebook {
		padding: 0 $unit-2x;
	}
</style>
