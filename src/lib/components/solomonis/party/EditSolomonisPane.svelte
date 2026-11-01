<script lang="ts">
	/**
	 * EditSolomonisPane - the one edit pane for a Solomonis party (D25): an
	 * unnamed section with the route Evoker, Transmigrant Pledge and outcome,
	 * and a Blessings section with a level stepper per released blessing
	 * (0 = not equipped) under the loadout's cost gauge. Any level can be
	 * picked; while the total is over the limit the gauge turns red and saving
	 * is blocked.
	 *
	 * The party's element and zone follow the route Evoker on the API side, so
	 * there's no element or zone control here. One Save hands both changes to
	 * the opener, which writes the expedition first, then the blessings.
	 */
	import { untrack } from 'svelte'
	import { createQuery } from '@tanstack/svelte-query'
	import * as m from '$lib/paraglide/messages'
	import DetailRow from '$lib/components/sidebar/details/DetailRow.svelte'
	import Select from '$lib/components/ui/Select.svelte'
	import Stepper from '$lib/components/ui/Stepper.svelte'
	import BlessingEditSection from './BlessingEditSection.svelte'
	import { sidebar } from '$lib/stores/sidebar.svelte'
	import { finishSolomonisPane, type SolomonisPaneChanges } from './openSolomonisPanes'
	import { solomonisQueries } from '$lib/api/queries/solomonis.queries'
	import { getCharacterImage } from '$lib/utils/images/characters'
	import { appLocale } from '$lib/utils/locale'
	import type { Party } from '$lib/types/api/party'
	import type { SolomonisOutcome } from '$lib/types/api/solomonis'
	import {
		DEFAULT_BLESSING_COST_LIMIT,
		MAX_PLEDGE_LEVEL,
		defaultRouteEvokerId,
		isFullExpedition,
		releasedBlessings,
		sameSelection,
		selectionCost,
		selectionFromParty,
		selectionToLevelIds,
		solomonisName,
		type BlessingSelection
	} from './solomonisParty'
	import { buildExpeditionInput, type ExpeditionFormValues } from './expeditionForm'

	interface Props {
		/** Pane ID injected by PaneStack */
		paneId?: string
		party: Party
		onSave: (changes: SolomonisPaneChanges) => void
	}

	let { paneId, party, onSave }: Props = $props()

	const routeEvokersQuery = createQuery(() => solomonisQueries.routeEvokers())
	const catalogueQuery = createQuery(() => solomonisQueries.blessings())

	const initialParty = untrack(() => $state.snapshot(party)) as Party
	const expedition = isFullExpedition(initialParty.solomonis) ? initialParty.solomonis : null

	const initial: ExpeditionFormValues = {
		routeEvokerId: expedition?.routeEvoker.id ?? null,
		pledgeLevel: expedition?.pledgeLevel ?? 0,
		outcome: expedition?.outcome ?? null
	}
	const initialSelection = selectionFromParty(expedition?.blessings ?? [])

	let routeEvokerId = $state<string | null>(initial.routeEvokerId)
	let pledgeLevel = $state(initial.pledgeLevel)
	let outcome = $state<SolomonisOutcome | null>(initial.outcome)
	let selection = $state<BlessingSelection>({ ...initialSelection })

	// Preselect the only eligible Evoker in the grid once the catalogue loads.
	$effect(() => {
		const evokers = routeEvokersQuery.data
		if (!evokers || routeEvokerId) return
		untrack(() => {
			routeEvokerId = defaultRouteEvokerId(initialParty, evokers)
		})
	})

	const locale = appLocale()
	const NONE = '__none__'

	const evokerOptions = $derived(
		(routeEvokersQuery.data ?? []).map((e) => ({
			value: e.id,
			label: solomonisName(e.name, locale),
			// Grouped under their zone's heading in the menu
			group: solomonisName(e.zone.name, locale),
			image: getCharacterImage(e.granblueId, 'square')
		}))
	)

	const outcomeOptions = [
		{ value: NONE, label: m.solomonis_web_party_not_set() },
		{ value: 'miasma_1', label: m.solomonis_web_party_outcome_miasma_1() },
		{ value: 'miasma_2', label: m.solomonis_web_party_outcome_miasma_2() },
		{ value: 'cleared', label: m.solomonis_web_party_outcome_cleared() }
	]

	const input = $derived(buildExpeditionInput({ routeEvokerId, pledgeLevel, outcome }, initial))
	const expeditionChanged = $derived(Object.keys(input).length > 0)

	const catalogue = $derived(catalogueQuery.data?.blessings ?? [])
	const costLimit = $derived(catalogueQuery.data?.costLimit ?? DEFAULT_BLESSING_COST_LIMIT)
	const available = $derived(releasedBlessings(catalogue))
	const total = $derived(selectionCost(catalogue, selection))
	const overLimit = $derived(total > costLimit)
	const blessingsChanged = $derived(!sameSelection(selection, initialSelection))

	const changed = $derived(expeditionChanged || blessingsChanged)
	const canSave = $derived(
		!!routeEvokerId && changed && (!blessingsChanged || (!!catalogueQuery.data && !overLimit))
	)

	function save() {
		if (!canSave) return
		onSave({
			expedition: expeditionChanged ? input : null,
			blessingLevelIds: blessingsChanged ? selectionToLevelIds(catalogue, selection) : null
		})
		finishSolomonisPane()
	}

	$effect(() => {
		const enabled = canSave
		untrack(() => {
			if (paneId) {
				sidebar.setActionForPane(paneId, enabled ? save : undefined, m.action_save())
				sidebar.paneStack.updatePaneById(paneId, { hasUnsavedChanges: () => changed })
			} else {
				sidebar.setAction(enabled ? save : undefined, m.action_save())
			}
		})
	})
</script>

<div class="solomonis-pane">
	<!-- No heading: the pane title already names the mode -->
	<div class="expedition">
		<DetailRow label={m.solomonis_web_party_route_evoker()} compact>
			<Select
				options={evokerOptions}
				value={routeEvokerId ?? undefined}
				onValueChange={(v) => (routeEvokerId = v ?? null)}
				placeholder={m.solomonis_web_party_select_evoker()}
				size="medium"
				contained
			/>
		</DetailRow>
		{#if !routeEvokerId}
			<p class="hint">{m.solomonis_web_party_route_required()}</p>
		{/if}
		<DetailRow label={m.solomonis_web_party_pledge()} compact>
			<Stepper
				value={pledgeLevel}
				max={MAX_PLEDGE_LEVEL}
				onChange={(value) => (pledgeLevel = value)}
				size="medium"
				label={m.solomonis_web_party_pledge()}
				decreaseLabel={m.solomonis_web_party_pledge_down()}
				increaseLabel={m.solomonis_web_party_pledge_up()}
			/>
		</DetailRow>
		<DetailRow label={m.solomonis_web_party_outcome()} compact>
			<Select
				options={outcomeOptions}
				value={outcome ?? NONE}
				onValueChange={(v) => (outcome = !v || v === NONE ? null : (v as SolomonisOutcome))}
				size="medium"
				contained
			/>
		</DetailRow>
	</div>

	<hr class="divider" />

	<BlessingEditSection blessings={available} bind:selection {total} limit={costLimit} />
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;

	.solomonis-pane {
		display: flex;
		flex-direction: column;
		gap: $unit-3x;
		padding-bottom: $unit-2x;
	}

	// Same spacing as a DetailsSection, without its heading
	.expedition {
		display: flex;
		flex-direction: column;
		gap: calc($unit * 1.5);
		padding: $unit-2x $unit 0;
	}

	.hint {
		margin: 0;
		padding: 0 $unit-2x;
		font-size: $font-small;
		color: var(--text-tertiary);
	}

	.divider {
		border: none;
		border-top: 1px solid var(--border-subtle);
		margin: 0;
	}
</style>
