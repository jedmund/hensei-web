<script lang="ts">
	/**
	 * Unseal priority pane for Solomonis parties. Lists the party's sealed
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
		setPriority,
		toPriorityPayload,
		type PriorityEntry,
		type PriorityLists,
		type SealItemType
	} from './seal'

	interface Props {
		paneId?: string
		canEdit?: boolean
	}

	let { paneId, canEdit = false }: Props = $props()

	// Each type has its own ranked and unranked lists, as drop containers
	// named `<type>:ranked` and `<type>:unranked`. The dnd type is the item
	// type, so DropZone keeps weapons and summons apart.
	type ListName = 'ranked' | 'unranked'
	const container = (type: SealItemType, list: ListName) => `${type}:${list}`
	function parseContainer(name: string): { type: SealItemType; list: ListName } | null {
		const [type, list] = name.split(':')
		if ((type !== 'weapon' && type !== 'summon') || (list !== 'ranked' && list !== 'unranked'))
			return null
		return { type, list }
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

	const mutation = useUpdateUnsealPriority()

	function keyAt(name: string, index: number): string | undefined {
		const target = parseContainer(name)
		const entry = target ? lists[target.type][target.list][index] : undefined
		return entry ? entryKey(entry) : undefined
	}

	function move(from: DragSource, to: DropTarget) {
		const source = parseContainer(from.container)
		const target = parseContainer(to.container)
		if (!source || !target || source.type !== target.type) return
		const key = keyAt(from.container, from.position)
		if (!key) return
		lists = setPriority(lists, target.type, key, target.list === 'ranked' ? to.position + 1 : null)
	}

	const dragContext = createDragDropContext({
		onDrop: (from, to) => move(from, to),
		onSwap: (from, to) => move(from, to),
		onValidate: (from, to) => {
			const source = parseContainer(from.container)
			const target = parseContainer(to.container)
			return (
				canEdit &&
				!!source &&
				!!target &&
				source.type === target.type &&
				!(source.list === 'unranked' && target.list === 'unranked')
			)
		}
	})
	setDragDropContext(dragContext)

	function add(entry: PriorityEntry) {
		lists = setPriority(lists, entry.type, entryKey(entry), lists[entry.type].ranked.length + 1)
	}

	function remove(entry: PriorityEntry) {
		lists = setPriority(lists, entry.type, entryKey(entry), null)
	}

	const TYPE_LABELS: Record<SealItemType, () => string> = {
		weapon: m.solomonis_web_grid_priority_weapons,
		summon: m.solomonis_web_grid_priority_summons
	}
	const RANKED_EMPTY: Record<SealItemType, () => string> = {
		weapon: m.solomonis_web_grid_priority_ranked_empty_weapons,
		summon: m.solomonis_web_grid_priority_ranked_empty_summons
	}
	const UNRANKED_EMPTY: Record<SealItemType, () => string> = {
		weapon: m.solomonis_web_grid_priority_unranked_empty_weapons,
		summon: m.solomonis_web_grid_priority_unranked_empty_summons
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
</script>

{#snippet row(entry: PriorityEntry, list: ListName, index: number)}
	{@const name = container(entry.type, list)}
	<DropZone container={name} position={index} type={entry.type} item={entry.item} canDrop={canEdit}>
		<DraggableItem
			item={entry.item}
			container={name}
			position={index}
			type={entry.type}
			canDrag={canEdit}
		>
			<UnsealPriorityRow
				{entry}
				rank={list === 'ranked' ? index + 1 : null}
				onAdd={canEdit && list === 'unranked' ? () => add(entry) : undefined}
				onRemove={canEdit && list === 'ranked' ? () => remove(entry) : undefined}
			/>
		</DraggableItem>
	</DropZone>
{/snippet}

<div class="unseal-priority-pane">
	{#if isEmpty}
		<p class="empty">{m.solomonis_web_grid_priority_none()}</p>
	{:else}
		{#each PRIORITY_TYPES as type (type)}
			{@const { ranked, unranked } = lists[type]}
			{#if ranked.length + unranked.length > 0}
				<section class="type-section" aria-labelledby="unseal-{type}-heading">
					<h3 id="unseal-{type}-heading">{TYPE_LABELS[type]()}</h3>

					<div class="list-group">
						<h4>{m.solomonis_web_grid_priority_ranked()}</h4>
						<ol class="list">
							{#each ranked as entry, i (entryKey(entry))}
								<li>{@render row(entry, 'ranked', i)}</li>
							{/each}
							{#if canEdit}
								<li>
									<DropZone
										container={container(type, 'ranked')}
										position={ranked.length}
										{type}
										canDrop={canEdit}
									>
										<p class="drop-hint">{RANKED_EMPTY[type]()}</p>
									</DropZone>
								</li>
							{/if}
						</ol>
					</div>

					{#if unranked.length > 0 || canEdit}
						<div class="list-group">
							<h4>{m.solomonis_web_grid_priority_unranked()}</h4>
							{#if unranked.length === 0}
								<DropZone
									container={container(type, 'unranked')}
									position={0}
									{type}
									canDrop={canEdit}
								>
									<p class="drop-hint">{UNRANKED_EMPTY[type]()}</p>
								</DropZone>
							{:else}
								<ul class="list">
									{#each unranked as entry, i (entryKey(entry))}
										<li>{@render row(entry, 'unranked', i)}</li>
									{/each}
								</ul>
							{/if}
						</div>
					{/if}
				</section>
			{/if}
		{/each}
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

	.type-section {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-2x;
	}

	.list-group {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;
	}

	h3 {
		margin: 0;
		font-size: typography.$font-regular;
		font-weight: typography.$bold;
		color: var(--text-primary);
	}

	h4 {
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
