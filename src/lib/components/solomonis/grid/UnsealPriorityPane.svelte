<script lang="ts">
	/**
	 * Unseal priority pane for Solomonis parties. Lists the party's sealed
	 * weapons and summons, one list per type: ranked items first, then the
	 * rest in grid order. Reordering a list ranks every item in it in the new
	 * order. Saving writes both lists in one request.
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
	import UnsealPriorityRow from './UnsealPriorityRow.svelte'
	import { partyStore } from '$lib/stores/partyStore.svelte'
	import { sidebar } from '$lib/stores/sidebar.svelte'
	import { useUpdateUnsealPriority } from '$lib/api/mutations/solomonis-grid.mutations'
	import { extractErrorMessage } from '$lib/utils/errors'
	import * as m from '$lib/paraglide/messages'
	import {
		entryKey,
		PRIORITY_TYPES,
		priorityLists,
		toPriorityPayload,
		type PriorityLists,
		type SealItemType
	} from './seal'

	interface Props {
		paneId?: string
		canEdit?: boolean
	}

	let { paneId, canEdit = false }: Props = $props()

	// Each type is one drop container named after the type, which is also the
	// dnd type, so DropZone keeps weapons and summons apart.
	function parseContainer(name: string): SealItemType | null {
		return name === 'weapon' || name === 'summon' ? name : null
	}

	const initial = untrack(() =>
		partyStore.party
			? priorityLists(partyStore.party)
			: { weapon: { ranked: [], unranked: [] }, summon: { ranked: [], unranked: [] } }
	)
	let lists = $state<PriorityLists>(initial)
	const payloadKey = (value: PriorityLists) =>
		toPriorityPayload(value)
			.map((item) => `${item.type}:${item.id}`)
			.join(',')
	let savedKey = $state(payloadKey(initial))

	const hasChanges = $derived(payloadKey(lists) !== savedKey)
	const isEmpty = $derived(
		PRIORITY_TYPES.every((type) => lists[type].ranked.length + lists[type].unranked.length === 0)
	)

	const mutation = useUpdateUnsealPriority(() => partyStore.party?.id)

	/** Ranked items first, then the unranked ones in grid order. */
	const ordered = (type: SealItemType) => [...lists[type].ranked, ...lists[type].unranked]

	function move(from: DragSource, to: DropTarget) {
		const type = parseContainer(from.container)
		if (!type || type !== parseContainer(to.container)) return
		const order = ordered(type)
		const [entry] = order.splice(from.position, 1)
		if (!entry) return
		order.splice(to.position, 0, entry)
		lists = { ...lists, [type]: { ranked: order, unranked: [] } }
	}

	const dragContext = createDragDropContext({
		onDrop: (from, to) => move(from, to),
		onSwap: (from, to) => move(from, to),
		onValidate: (from, to) => {
			const type = parseContainer(from.container)
			return canEdit && !!type && type === parseContainer(to.container)
		}
	})
	setDragDropContext(dragContext)

	const TYPE_LABELS: Record<SealItemType, () => string> = {
		weapon: m.solomonis_web_grid_priority_weapons,
		summon: m.solomonis_web_grid_priority_summons
	}
	async function save() {
		const party = partyStore.party
		if (!party || !hasChanges || mutation.isPending) return
		const items = toPriorityPayload(lists)
		try {
			await mutation.mutateAsync({
				partyId: party.id,
				partyShortcode: party.shortcode,
				items
			})
			savedKey = payloadKey(lists)
			toast.success(m.solomonis_web_grid_priority_saved())
			// Back to the details pane when opened from it
			if (sidebar.paneStack.depth > 1) sidebar.pop()
			else sidebar.close()
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
</script>

<div class="unseal-priority-pane">
	{#if isEmpty}
		<p class="empty">{m.solomonis_web_grid_priority_none()}</p>
	{:else}
		{#each PRIORITY_TYPES as type (type)}
			{@const entries = ordered(type)}
			{#if entries.length > 0}
				<section class="type-section" aria-labelledby="unseal-{type}-heading">
					<header>
						<h3 id="unseal-{type}-heading">{TYPE_LABELS[type]()}</h3>
						{#if lists[type].ranked.length === 0}
							<span class="status">{m.solomonis_web_grid_priority_unranked()}</span>
						{/if}
					</header>
					<ol class="list">
						{#each entries as entry, i (entryKey(entry))}
							<li>
								<DropZone container={type} position={i} {type} item={entry.item} canDrop={canEdit}>
									<DraggableItem
										item={entry.item}
										container={type}
										position={i}
										{type}
										canDrag={canEdit}
									>
										<UnsealPriorityRow {entry} rank={i + 1} {canEdit} />
									</DraggableItem>
								</DropZone>
							</li>
						{/each}
					</ol>
				</section>
			{/if}
		{/each}
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.unseal-priority-pane {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-3x;
		padding: spacing.$unit-2x;
	}

	.type-section {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;
	}

	header {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: spacing.$unit;
	}

	h3 {
		margin: 0;
		font-size: typography.$font-regular;
		font-weight: typography.$bold;
		color: var(--text-primary);
	}

	.status {
		font-size: typography.$font-small;
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

	.empty {
		margin: 0;
		padding: spacing.$unit-2x;
		font-size: typography.$font-small;
		color: var(--text-tertiary);
		text-align: center;
	}
</style>
