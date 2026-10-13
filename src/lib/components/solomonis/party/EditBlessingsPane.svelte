<script lang="ts">
	/**
	 * EditBlessingsPane - pick the party's Arcarum Blessings: a level stepper
	 * per released blessing (0 = not equipped), with the loadout's total cost
	 * as a gauge against the catalogue's limit. Any level can be picked; while
	 * the total is over the limit the gauge turns red and saving is blocked. Each blessing shows what it does at its level, or at level 1
	 * when it isn't equipped.
	 */
	import { untrack } from 'svelte'
	import { createQuery } from '@tanstack/svelte-query'
	import * as m from '$lib/paraglide/messages'
	import BlessingName from './BlessingName.svelte'
	import BlessingCostGauge from './BlessingCostGauge.svelte'
	import Stepper from '$lib/components/ui/Stepper.svelte'
	import { sidebar } from '$lib/stores/sidebar.svelte'
	import { finishSolomonisPane } from './openSolomonisPanes'
	import { solomonisQueries } from '$lib/api/queries/solomonis.queries'
	import { appLocale } from '$lib/utils/locale'
	import type { ArcarumBlessing, PartyBlessing } from '$lib/types/api/solomonis'
	import {
		DEFAULT_BLESSING_COST_LIMIT,
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

	const catalogue = $derived(catalogueQuery.data?.blessings ?? [])
	const costLimit = $derived(catalogueQuery.data?.costLimit ?? DEFAULT_BLESSING_COST_LIMIT)
	const available = $derived(releasedBlessings(catalogue))
	const total = $derived(selectionCost(catalogue, selection))
	const overLimit = $derived(total > costLimit)
	const changed = $derived(!sameSelection(selection, initialSelection))
	const canSave = $derived(!!catalogueQuery.data && changed && !overLimit)

	/** The selected level of a blessing, if it's equipped. */
	function selectedLevel(blessing: ArcarumBlessing) {
		return blessing.levels.find((l) => l.id === selection[blessing.id])
	}

	function maxLevel(blessing: ArcarumBlessing): number {
		return Math.max(0, ...blessing.levels.map((l) => l.level))
	}

	function setLevel(blessing: ArcarumBlessing, level: number) {
		const next = { ...selection }
		const target = blessing.levels.find((l) => l.level === level)
		if (target) next[blessing.id] = target.id
		else delete next[blessing.id]
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
	<BlessingCostGauge {total} limit={costLimit} />

	<ul class="blessings">
		{#each available as blessing (blessing.id)}
			{@const level = selectedLevel(blessing)}
			{@const described = level ?? blessing.levels.find((l) => l.level === 1)}
			{@const name = solomonisName(blessing.name, locale)}
			<li class="blessing">
				<div class="row">
					<BlessingName
						slug={blessing.slug}
						{name}
						size="large"
						subtitle={level
							? m.solomonis_web_party_blessing_cost({ cost: level.cost })
							: m.solomonis_web_party_blessing_not_equipped()}
					/>
					<Stepper
						value={level?.level ?? 0}
						max={maxLevel(blessing)}
						onChange={(value) => setLevel(blessing, value)}
						label={name}
						decreaseLabel={m.solomonis_web_party_blessing_level_down({ name })}
						increaseLabel={m.solomonis_web_party_blessing_level_up({ name })}
					/>
				</div>
				{#if described}
					<p class="effect" class:preview={!level}>
						{solomonisName(described.description, locale)}
					</p>
				{/if}
			</li>
		{/each}
	</ul>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;

	.blessings-pane {
		display: flex;
		flex-direction: column;
		gap: $unit-2x;
		padding: 0 $unit-2x $unit-2x;
	}

	.blessings {
		display: flex;
		flex-direction: column;
		gap: $unit-2x;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.blessing {
		display: flex;
		flex-direction: column;
		gap: $unit;
	}

	.row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: $unit;
	}

	.effect {
		margin: 0;
		font-size: $font-small;
		color: var(--text-secondary);

		// Level 1's effect, for a blessing that isn't equipped
		&.preview {
			color: var(--text-tertiary);
		}
	}
</style>
