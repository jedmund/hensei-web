<script lang="ts">
	/**
	 * Unseal priority pane for Solomonis builds. Lists the build's sealed
	 * weapons and summons; users drag them into a ranked list and reorder it,
	 * and anything left out stays unranked below. Saving writes the whole list
	 * in one request.
	 *
	 * Rendered in the sidebar, outside the party's component tree, so it reads
	 * the party from partyStore and provides its own drag-and-drop context for
	 * the shared DraggableItem/DropZone components.
	 */
	import { untrack } from 'svelte'
	import { toast } from 'svelte-sonner'
	import {
		createDragDropContext,
		setDragDropContext,
		type DragSource,
		type DropTarget
	} from '$lib/composables/drag-drop.svelte'
	import DraggableItem from '$lib/components/dnd/DraggableItem.svelte'
	import DropZone from '$lib/components/dnd/DropZone.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import { partyStore } from '$lib/stores/partyStore.svelte'
	import { sidebar } from '$lib/stores/sidebar.svelte'
	import { useUpdateUnsealPriority } from '$lib/api/mutations/solomonis-grid.mutations'
	import { getSummonImage, getWeaponImage } from '$lib/utils/images'
	import { localizedName } from '$lib/utils/locale'
	import { extractErrorMessage } from '$lib/utils/errors'
	import * as m from '$lib/paraglide/messages'
	import type { GridSummon, GridWeapon } from '$lib/types/api/party'
	import {
		circledNumber,
		entryKey,
		priorityLists,
		rankAt,
		toPriorityPayload,
		unrank,
		type PriorityEntry
	} from './seal'

	interface Props {
		paneId?: string
		canEdit?: boolean
	}

	let { paneId, canEdit = false }: Props = $props()

	const RANKED = 'unseal-ranked'
	const UNRANKED = 'unseal-unranked'
	// DropZone rejects drops between different types, but weapons and summons
	// share one list, so every row uses the same dnd type.
	const DND_TYPE = 'weapon'

	const initial = untrack(() =>
		partyStore.party ? priorityLists(partyStore.party) : { ranked: [], unranked: [] }
	)
	let ranked = $state<PriorityEntry[]>(initial.ranked)
	let unranked = $state<PriorityEntry[]>(initial.unranked)
	let savedKeys = $state(initial.ranked.map(entryKey).join(','))

	const hasChanges = $derived(ranked.map(entryKey).join(',') !== savedKeys)
	const isEmpty = $derived(ranked.length === 0 && unranked.length === 0)

	const mutation = useUpdateUnsealPriority()

	function keyAt(container: string, index: number): string | undefined {
		const list = container === RANKED ? ranked : container === UNRANKED ? unranked : []
		const entry = list[index]
		return entry ? entryKey(entry) : undefined
	}

	function move(from: DragSource, to: DropTarget) {
		const key = keyAt(from.container, from.position)
		if (!key) return
		const next =
			to.container === RANKED
				? rankAt(ranked, unranked, key, to.position)
				: unrank(ranked, unranked, key)
		ranked = next.ranked
		unranked = next.unranked
	}

	const dragContext = createDragDropContext({
		onDrop: (from, to) => move(from, to),
		onSwap: (from, to) => move(from, to),
		onValidate: (from, to) => canEdit && !(from.container === UNRANKED && to.container === UNRANKED)
	})
	setDragDropContext(dragContext)

	function add(entry: PriorityEntry) {
		const next = rankAt(ranked, unranked, entryKey(entry), ranked.length)
		ranked = next.ranked
		unranked = next.unranked
	}

	function remove(entry: PriorityEntry) {
		const next = unrank(ranked, unranked, entryKey(entry))
		ranked = next.ranked
		unranked = next.unranked
	}

	async function save() {
		const party = partyStore.party
		if (!party || !hasChanges || mutation.isPending) return
		const items = toPriorityPayload(ranked)
		try {
			await mutation.mutateAsync({
				partyId: party.id,
				partyShortcode: party.shortcode,
				items
			})
			savedKeys = ranked.map(entryKey).join(',')
			toast.success(m.solomonis_web_grid_priority_saved())
			sidebar.close()
		} catch (err) {
			toast.error(extractErrorMessage(err, m.solomonis_web_grid_priority_save_failed()))
		}
	}

	// Header Save button and unsaved-changes guard, as other edit panes do.
	// paneId is read inside untrack(): updating the pane re-spreads its props.
	$effect(() => {
		const changed = hasChanges && canEdit
		untrack(() => {
			if (!paneId) return
			sidebar.setActionForPane(paneId, changed ? save : undefined, m.action_save())
			sidebar.paneStack.updatePaneById(paneId, {
				hasUnsavedChanges: () => hasChanges && canEdit
			})
		})
	})

	function imageFor(entry: PriorityEntry): string {
		return entry.type === 'weapon'
			? getWeaponImage((entry.item as GridWeapon).weapon?.granblueId, 'grid')
			: getSummonImage((entry.item as GridSummon).summon?.granblueId, 'grid')
	}

	function nameFor(entry: PriorityEntry): string {
		return entry.type === 'weapon'
			? localizedName((entry.item as GridWeapon).weapon?.name)
			: localizedName((entry.item as GridSummon).summon?.name)
	}

	function slotLabel(entry: PriorityEntry): string {
		const position = String(entry.position + 1)
		return entry.type === 'weapon'
			? m.solomonis_web_grid_weapon_slot({ position })
			: m.solomonis_web_grid_summon_slot({ position })
	}
</script>

{#snippet row(entry: PriorityEntry, container: string, index: number)}
	<DropZone {container} position={index} type={DND_TYPE} item={entry.item} canDrop={canEdit}>
		<DraggableItem item={entry.item} {container} position={index} type={DND_TYPE} canDrag={canEdit}>
			<div class="row" data-testid="unseal-priority-row">
				<span class="rank" aria-hidden={container !== RANKED}>
					{container === RANKED ? circledNumber(index + 1) : ''}
				</span>
				<img class="thumb" class:summon={entry.type === 'summon'} src={imageFor(entry)} alt="" />
				<span class="text">
					<span class="name">{nameFor(entry)}</span>
					<span class="slot">{slotLabel(entry)}</span>
				</span>
				{#if canEdit}
					{#if container === RANKED}
						<Button
							variant="ghost"
							size="small"
							iconOnly
							icon="close"
							title={m.solomonis_web_grid_priority_remove()}
							aria-label={m.solomonis_web_grid_priority_remove()}
							onclick={() => remove(entry)}
						/>
					{:else}
						<Button
							variant="ghost"
							size="small"
							iconOnly
							icon="plus"
							title={m.solomonis_web_grid_priority_add()}
							aria-label={m.solomonis_web_grid_priority_add()}
							onclick={() => add(entry)}
						/>
					{/if}
				{/if}
			</div>
		</DraggableItem>
	</DropZone>
{/snippet}

<div class="unseal-priority-pane">
	{#if isEmpty}
		<p class="empty">{m.solomonis_web_grid_priority_none()}</p>
	{:else}
		<section aria-labelledby="unseal-ranked-heading">
			<h3 id="unseal-ranked-heading">{m.solomonis_web_grid_priority_ranked()}</h3>
			<ol class="list">
				{#each ranked as entry, i (entryKey(entry))}
					<li>{@render row(entry, RANKED, i)}</li>
				{/each}
				{#if canEdit}
					<li>
						<DropZone container={RANKED} position={ranked.length} type={DND_TYPE} canDrop={canEdit}>
							<p class="drop-hint">{m.solomonis_web_grid_priority_ranked_empty()}</p>
						</DropZone>
					</li>
				{/if}
			</ol>
		</section>

		<section aria-labelledby="unseal-unranked-heading">
			<h3 id="unseal-unranked-heading">{m.solomonis_web_grid_priority_unranked()}</h3>
			{#if unranked.length === 0}
				<DropZone container={UNRANKED} position={0} type={DND_TYPE} canDrop={canEdit}>
					<p class="drop-hint">{m.solomonis_web_grid_priority_unranked_empty()}</p>
				</DropZone>
			{:else}
				<ul class="list">
					{#each unranked as entry, i (entryKey(entry))}
						<li>{@render row(entry, UNRANKED, i)}</li>
					{/each}
				</ul>
			{/if}
		</section>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.unseal-priority-pane {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-3x;
		padding: spacing.$unit-2x;
	}

	section {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;
	}

	h3 {
		margin: 0;
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		color: var(--text-secondary);
	}

	.list {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-half;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.row {
		display: flex;
		align-items: center;
		gap: spacing.$unit;
		padding: spacing.$unit-half spacing.$unit;
		border-radius: layout.$item-corner;
		background: var(--button-contained-bg);
	}

	.rank {
		flex: 0 0 24px;
		text-align: center;
		font-size: 1.8rem;
		font-weight: typography.$bold;
		color: var(--text-primary);
	}

	.thumb {
		flex: 0 0 auto;
		width: 64px;
		height: auto;
		border-radius: layout.$item-corner-small;

		&.summon {
			width: 56px;
		}
	}

	.text {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-width: 0;
		text-align: left;
	}

	.name {
		font-size: typography.$font-small;
		color: var(--text-primary);
		overflow-wrap: anywhere;
	}

	.slot {
		font-size: typography.$font-tiny;
		color: var(--text-tertiary);
	}

	.drop-hint,
	.empty {
		margin: 0;
		padding: spacing.$unit-2x;
		border: 1px dashed var(--border-subtle);
		border-radius: layout.$item-corner;
		font-size: typography.$font-small;
		color: var(--text-tertiary);
		text-align: center;
	}

	.empty {
		border: none;
	}
</style>
