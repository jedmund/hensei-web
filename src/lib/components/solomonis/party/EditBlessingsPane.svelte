<script lang="ts">
	/**
	 * EditBlessingsPane - pick the party's Arcarum Blessings: one level per
	 * released blessing, with the loadout's total cost against the catalogue's
	 * cost limit. Levels that would push the total over the limit are disabled,
	 * and saving is blocked while it's over.
	 */
	import { untrack } from 'svelte'
	import { createQuery } from '@tanstack/svelte-query'
	import * as m from '$lib/paraglide/messages'
	import DetailsSection from '$lib/components/sidebar/details/DetailsSection.svelte'
	import DetailRow from '$lib/components/sidebar/details/DetailRow.svelte'
	import Select from '$lib/components/ui/Select.svelte'
	import { sidebar } from '$lib/stores/sidebar.svelte'
	import { finishSolomonisPane } from './openSolomonisPanes'
	import { solomonisQueries } from '$lib/api/queries/solomonis.queries'
	import { appLocale } from '$lib/utils/locale'
	import type { PartyBlessing } from '$lib/types/api/solomonis'
	import {
		DEFAULT_BLESSING_COST_LIMIT,
		levelFits,
		releasedBlessings,
		sameSelection,
		selectionCost,
		selectionFromParty,
		selectionToLevelIds,
		solomonisName,
		type BlessingSelection
	} from './solomonisParty'

	interface Props {
		/** Pane ID injected by PaneStack */
		paneId?: string
		blessings: PartyBlessing[]
		onSave: (blessingLevelIds: string[]) => void
	}

	let { paneId, blessings, onSave }: Props = $props()

	const catalogueQuery = createQuery(() => solomonisQueries.blessings())

	const initialSelection = untrack(() =>
		selectionFromParty($state.snapshot(blessings) as PartyBlessing[])
	)
	let selection = $state<BlessingSelection>({ ...initialSelection })

	const locale = appLocale()
	const NONE = '__none__'

	const catalogue = $derived(catalogueQuery.data?.blessings ?? [])
	const costLimit = $derived(catalogueQuery.data?.costLimit ?? DEFAULT_BLESSING_COST_LIMIT)
	const available = $derived(releasedBlessings(catalogue))
	const total = $derived(selectionCost(catalogue, selection))
	const overLimit = $derived(total > costLimit)
	const changed = $derived(!sameSelection(selection, initialSelection))
	const canSave = $derived(!!catalogueQuery.data && changed && !overLimit)

	function optionsFor(blessingId: string) {
		const blessing = catalogue.find((b) => b.id === blessingId)
		if (!blessing) return []
		return [
			{ value: NONE, label: m.solomonis_web_party_blessing_not_equipped() },
			...blessing.levels.map((level) => ({
				value: level.id,
				label: m.solomonis_web_party_level({ level: level.level }),
				suffix: m.solomonis_web_party_blessing_cost({ cost: level.cost }),
				subtitle: solomonisName(level.description, locale),
				disabled: !levelFits(catalogue, selection, blessingId, level.id, costLimit)
			}))
		]
	}

	function select(blessingId: string, levelId: string | undefined) {
		const next = { ...selection }
		if (!levelId || levelId === NONE) delete next[blessingId]
		else next[blessingId] = levelId
		selection = next
	}

	function save() {
		if (!canSave) return
		onSave(selectionToLevelIds(catalogue, selection))
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

<div class="blessings-pane">
	<DetailsSection title={m.solomonis_web_party_blessings()}>
		{#snippet action()}
			<span class="total" class:over={overLimit}>
				{m.solomonis_web_party_blessing_cost_total({ total, limit: costLimit })}
			</span>
		{/snippet}
		{#each available as blessing (blessing.id)}
			<DetailRow label={solomonisName(blessing.name, locale)} compact>
				<Select
					options={optionsFor(blessing.id)}
					value={selection[blessing.id] ?? NONE}
					onValueChange={(v) => select(blessing.id, v)}
					size="small"
					contained
				/>
			</DetailRow>
		{/each}
		{#if overLimit}
			<p class="error" role="alert">
				{m.solomonis_web_party_blessing_over_limit({ limit: costLimit })}
			</p>
		{/if}
	</DetailsSection>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/colors' as *;

	.blessings-pane {
		display: flex;
		flex-direction: column;
		gap: $unit-3x;
		padding-bottom: $unit-2x;
	}

	.total {
		font-size: $font-small;
		color: var(--text-secondary);
		font-variant-numeric: tabular-nums;

		&.over {
			color: $error;
		}
	}

	.error {
		margin: 0;
		padding: 0 $unit-2x;
		font-size: $font-small;
		color: $error;
	}
</style>
