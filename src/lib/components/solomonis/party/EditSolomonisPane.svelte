<script lang="ts">
	/**
	 * EditSolomonisPane - sidebar pane for a Solomonis party's expedition fields:
	 * kind, route Evoker, pledge level, and for runs the outcome, bosses
	 * defeated, midboss, Expedition Lvl and end date.
	 *
	 * The party's element and zone follow the route Evoker on the API side, so
	 * there's no element or zone control here.
	 */
	import { untrack } from 'svelte'
	import { createQuery } from '@tanstack/svelte-query'
	import * as m from '$lib/paraglide/messages'
	import DetailsSection from '$lib/components/sidebar/details/DetailsSection.svelte'
	import DetailRow from '$lib/components/sidebar/details/DetailRow.svelte'
	import SegmentedControl from '$lib/components/ui/segmented-control/SegmentedControl.svelte'
	import Segment from '$lib/components/ui/segmented-control/Segment.svelte'
	import Select from '$lib/components/ui/Select.svelte'
	import Input from '$lib/components/ui/Input.svelte'
	import DatePicker from '$lib/components/ui/DatePicker.svelte'
	import { sidebar } from '$lib/stores/sidebar.svelte'
	import { solomonisQueries } from '$lib/api/queries/solomonis.queries'
	import { getCharacterImage } from '$lib/utils/images'
	import { appLocale } from '$lib/utils/locale'
	import type { Party } from '$lib/types/api/party'
	import type {
		SolomonisExpeditionInput,
		SolomonisKind,
		SolomonisMidboss,
		SolomonisOutcome
	} from '$lib/types/api/solomonis'
	import {
		MAX_BOSSES_DEFEATED,
		MAX_PLEDGE_LEVEL,
		defaultRouteEvokerId,
		endedAtFromJstDate,
		isFullExpedition,
		jstDate,
		solomonisName
	} from './solomonisParty'
	import { buildExpeditionInput, type ExpeditionFormValues } from './expeditionForm'

	interface Props {
		/** Pane ID injected by PaneStack */
		paneId?: string
		party: Party
		onSave: (input: SolomonisExpeditionInput) => void
	}

	let { paneId, party, onSave }: Props = $props()

	const routeEvokersQuery = createQuery(() => solomonisQueries.routeEvokers())

	const initialParty = untrack(() => $state.snapshot(party)) as Party
	const expedition = isFullExpedition(initialParty.solomonis) ? initialParty.solomonis : null

	const initial: ExpeditionFormValues = {
		kind: expedition?.kind ?? 'build',
		routeEvokerId: expedition?.routeEvoker.id ?? null,
		pledgeLevel: expedition?.pledgeLevel ?? 0,
		outcome: expedition?.outcome ?? null,
		bossesDefeated: expedition?.bossesDefeated ?? null,
		midboss: expedition?.midboss ?? null,
		expeditionLevel: expedition?.expeditionLevel ?? null,
		endedAt: expedition?.endedAt ?? null
	}

	let kind = $state<SolomonisKind>(initial.kind)
	let routeEvokerId = $state<string | null>(initial.routeEvokerId)
	let pledgeLevel = $state(initial.pledgeLevel)
	let outcome = $state<SolomonisOutcome | null>(initial.outcome)
	let bossesDefeated = $state<number | null>(initial.bossesDefeated)
	let midboss = $state<SolomonisMidboss | null>(initial.midboss)
	let expeditionLevelText = $state(initial.expeditionLevel?.toString() ?? '')
	let endedDate = $state<string | null>(jstDate(initial.endedAt))

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
			subtitle: solomonisName(e.zone.name, locale),
			image: getCharacterImage(e.granblueId, 'square')
		}))
	)

	const pledgeOptions = Array.from({ length: MAX_PLEDGE_LEVEL + 1 }, (_, level) => ({
		value: level,
		label:
			level === 0 ? m.solomonis_web_party_pledge_none() : m.solomonis_web_party_level({ level })
	}))

	const outcomeOptions = [
		{ value: NONE, label: m.solomonis_web_party_not_set() },
		{ value: 'cleared', label: m.solomonis_web_party_outcome_cleared() },
		{ value: 'failed', label: m.solomonis_web_party_outcome_failed() }
	]

	const bossOptions = [
		{ value: NONE, label: m.solomonis_web_party_not_set() },
		...Array.from({ length: MAX_BOSSES_DEFEATED + 1 }, (_, count) => ({
			value: String(count),
			label: m.solomonis_web_party_bosses_value({ count, max: MAX_BOSSES_DEFEATED })
		}))
	]

	const midbossOptions = [
		{ value: NONE, label: m.solomonis_web_party_not_set() },
		{ value: 'banes_gate', label: m.solomonis_web_party_midboss_banes_gate() },
		{ value: 'infernobringer', label: m.solomonis_web_party_midboss_infernobringer() },
		{ value: 'beast_of_anathema', label: m.solomonis_web_party_midboss_beast_of_anathema() }
	]

	const values = $derived<ExpeditionFormValues>({
		kind,
		routeEvokerId,
		pledgeLevel,
		outcome,
		bossesDefeated,
		midboss,
		expeditionLevel: parseLevel(expeditionLevelText),
		endedAt: endedAtFromJstDate(endedDate, initial.endedAt)
	})

	const input = $derived(buildExpeditionInput(values, initial))
	const canSave = $derived(!!routeEvokerId && Object.keys(input).length > 0)

	function handleOutcomeChange(v: string | undefined) {
		outcome = !v || v === NONE ? null : (v as SolomonisOutcome)
		// The API requires a cleared run to have defeated both bosses.
		if (outcome === 'cleared' && bossesDefeated !== null) bossesDefeated = MAX_BOSSES_DEFEATED
	}

	function parseLevel(text: string): number | null {
		const n = parseInt(text, 10)
		return Number.isNaN(n) || n < 0 ? null : n
	}

	function save() {
		if (!canSave) return
		onSave(input)
		sidebar.close()
	}

	$effect(() => {
		const enabled = canSave
		untrack(() => {
			if (paneId) {
				sidebar.setActionForPane(paneId, enabled ? save : undefined, m.action_save())
				sidebar.paneStack.updatePaneById(paneId, { hasUnsavedChanges: () => canSave })
			} else {
				sidebar.setAction(enabled ? save : undefined, m.action_save())
			}
		})
	})
</script>

<div class="solomonis-pane">
	<DetailsSection title={m.solomonis_web_party_title()}>
		<div class="kind-control">
			<SegmentedControl
				value={kind}
				onValueChange={(v) => (kind = v as SolomonisKind)}
				variant="background"
				size="small"
				grow
			>
				<Segment value="build">{m.solomonis_web_party_kind_build()}</Segment>
				<Segment value="run">{m.solomonis_web_party_kind_run()}</Segment>
			</SegmentedControl>
		</div>
		<DetailRow label={m.solomonis_web_party_route_evoker()} compact>
			<Select
				options={evokerOptions}
				value={routeEvokerId ?? undefined}
				onValueChange={(v) => (routeEvokerId = v ?? null)}
				placeholder={m.solomonis_web_party_select_evoker()}
				size="small"
				contained
			/>
		</DetailRow>
		{#if !routeEvokerId}
			<p class="hint">{m.solomonis_web_party_route_required()}</p>
		{/if}
		<DetailRow label={m.solomonis_web_party_pledge()} compact>
			<Select
				options={pledgeOptions}
				value={pledgeLevel}
				onValueChange={(v) => (pledgeLevel = v ?? 0)}
				size="small"
				contained
			/>
		</DetailRow>
	</DetailsSection>

	{#if kind === 'run'}
		<hr class="divider" />
		<DetailsSection title={m.solomonis_web_party_section_run()}>
			<DetailRow label={m.solomonis_web_party_outcome()} compact>
				<Select
					options={outcomeOptions}
					value={outcome ?? NONE}
					onValueChange={handleOutcomeChange}
					size="small"
					contained
				/>
			</DetailRow>
			<DetailRow label={m.solomonis_web_party_bosses_defeated()} compact>
				<Select
					options={bossOptions}
					value={bossesDefeated === null ? NONE : String(bossesDefeated)}
					onValueChange={(v) => (bossesDefeated = !v || v === NONE ? null : Number(v))}
					size="small"
					contained
				/>
			</DetailRow>
			<DetailRow label={m.solomonis_web_party_midboss()} compact>
				<Select
					options={midbossOptions}
					value={midboss ?? NONE}
					onValueChange={(v) => (midboss = !v || v === NONE ? null : (v as SolomonisMidboss))}
					size="small"
					contained
				/>
			</DetailRow>
			<DetailRow label={m.solomonis_web_party_expedition_level()} compact>
				<Input type="number" min="0" bind:value={expeditionLevelText} placeholder="—" contained />
			</DetailRow>
			<DetailRow label={m.solomonis_web_party_ended_at()} compact>
				<DatePicker bind:value={endedDate} {locale} contained />
			</DetailRow>
		</DetailsSection>
	{/if}
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

	.kind-control {
		padding: 0 $unit-2x;
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
