<script lang="ts">
	/**
	 * EditWondersPane - a team's Wonders: a toggle per battle-relevant Wonder
	 * that applies to the team (its element, and no Seals on Unite and
	 * Fight), with the controls its kind has. Wonders the pane doesn't show
	 * stay on the team as they were. Save hands the whole set to the opener.
	 */
	import { untrack } from 'svelte'
	import { createQuery } from '@tanstack/svelte-query'
	import { m } from '$lib/paraglide/messages'
	import DetailsSection from '$lib/components/sidebar/details/DetailsSection.svelte'
	import Switch from '$lib/components/ui/switch/Switch.svelte'
	import WonderImage from './WonderImage.svelte'
	import WonderStateFields from './WonderStateFields.svelte'
	import { sidebar } from '$lib/stores/sidebar.svelte'
	import { finishStackedPane } from '$lib/stores/stackedPanes'
	import { wonderQueries } from '$lib/api/queries/wonder.queries'
	import {
		appliesToTeam,
		compareCatalogueOrder,
		computeBonuses,
		defaultState,
		groupByCategory,
		partyWondersPayload,
		sameSelection,
		selectionFromParty,
		teamContext,
		wonderImageName
	} from '$lib/features/wonders/wonders'
	import { wonderSummary, wonderText } from '$lib/features/wonders/labels'
	import type { Party } from '$lib/types/api/party'
	import type { PartyWonderInput, Wonder, WonderState } from '$lib/types/api/wonder'

	interface Props {
		/** Pane ID injected by PaneStack */
		paneId?: string
		party: Party
		onSave: (wonders: PartyWonderInput[]) => void
	}

	let { paneId, party, onSave }: Props = $props()

	const catalogueQuery = createQuery(() => wonderQueries.catalogue())

	const initialParty = untrack(() => $state.snapshot(party)) as Party
	const existing = initialParty.wonders ?? []
	const context = teamContext(initialParty)

	const editable = $derived.by((): Wonder[] => {
		const catalogue = catalogueQuery.data
		if (!catalogue) return []
		return catalogue.wonders
			.filter((w) => w.battleRelevant && appliesToTeam(w, context))
			.sort(compareCatalogueOrder(catalogue))
	})
	const groups = $derived(
		catalogueQuery.data ? groupByCategory(editable, (w) => w, catalogueQuery.data) : []
	)

	let initialSelection = $state<Record<string, WonderState> | null>(null)
	let selection = $state<Record<string, WonderState>>({})

	// Start from the team's Wonders once the catalogue is in.
	$effect(() => {
		if (initialSelection || editable.length === 0) return
		untrack(() => {
			initialSelection = selectionFromParty(existing, editable)
			selection = { ...initialSelection }
		})
	})

	function toggle(wonder: Wonder, on: boolean) {
		if (on === !!selection[wonder.id]) return
		const next = { ...selection }
		if (on) next[wonder.id] = defaultState(wonder)
		else delete next[wonder.id]
		selection = next
	}

	function setState(wonder: Wonder, state: WonderState) {
		selection = { ...selection, [wonder.id]: state }
	}

	const changed = $derived(!!initialSelection && !sameSelection(selection, initialSelection))

	function save() {
		if (!changed) return
		onSave(partyWondersPayload(existing, editable, selection))
		finishStackedPane()
	}

	$effect(() => {
		const enabled = changed
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

<div class="wonders-edit">
	{#if catalogueQuery.data && groups.length === 0}
		<p class="hint">{m.wonders_party_none_apply()}</p>
	{/if}

	{#each groups as group (group.category.id)}
		<DetailsSection title={wonderText(group.category.name)}>
			<ul class="wonder-list">
				{#each group.items as wonder (wonder.id)}
					{@const state = selection[wonder.id]}
					{@const name = wonderText(wonder.name)}
					<li class="wonder-row" class:off={!state}>
						<!-- The label names the switch and makes the whole row a target -->
						<label class="wonder-header">
							<WonderImage
								image={wonderImageName(wonder, state ?? defaultState(wonder))}
								size={48}
								inactive={!state}
							/>
							<div class="wonder-name">
								<span class="name">{name}</span>
								{#if state}
									{@const summary = wonderSummary(wonder, {
										level: state.level,
										bonuses: computeBonuses(wonder, state)
									})}
									{#if summary}
										<span class="summary">{summary}</span>
									{/if}
								{/if}
							</div>
							<Switch checked={!!state} onCheckedChange={(on) => toggle(wonder, on)} size="small" />
						</label>
						{#if state}
							<div class="wonder-fields">
								<WonderStateFields {wonder} {state} onChange={(s) => setState(wonder, s)} />
							</div>
						{/if}
					</li>
				{/each}
			</ul>
		</DetailsSection>
	{/each}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;

	.wonders-edit {
		display: flex;
		flex-direction: column;
		gap: $unit-3x;
		padding: $unit-2x 0;
	}

	.hint {
		margin: 0;
		padding: 0 $unit-2x;
		font-size: $font-regular;
		color: var(--text-tertiary);
	}

	.wonder-list {
		display: flex;
		flex-direction: column;
		gap: $unit-2x;
		margin: 0;
		padding: 0 $unit;
		list-style: none;
	}

	.wonder-row {
		display: flex;
		flex-direction: column;
		gap: $unit;
	}

	.wonder-header {
		display: flex;
		align-items: center;
		gap: calc($unit * 1.5);
		padding: 0 $unit;
		cursor: pointer;
	}

	.wonder-name {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
	}

	.name {
		font-size: $font-regular;
		font-weight: $medium;
		color: var(--text-primary);
	}

	.off .name {
		color: var(--text-secondary);
	}

	.summary {
		font-size: $font-small;
		color: var(--text-secondary);
	}

	.wonder-fields {
		display: flex;
		flex-direction: column;
		gap: $unit;
	}
</style>
