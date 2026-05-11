<script lang="ts">
	import type { Substitution } from '$lib/types/api/party'
	import { useQueryClient } from '@tanstack/svelte-query'
	import { partyQueries } from '$lib/api/queries/party.queries'
	import {
		useCreateSubstitution,
		useDeleteSubstitution,
		useReorderSubstitutions
	} from '$lib/api/mutations/substitution.mutations'
	import { sidebar } from '$lib/stores/sidebar.svelte'
	import SearchContent from '$lib/components/sidebar/SearchContent.svelte'
	import SubstitutionRow from './SubstitutionRow.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import * as m from '$lib/paraglide/messages'
	import type { AddItemResult } from '$lib/types/api/search'
	import { toast } from 'svelte-sonner'
	import { extractErrorMessage } from '$lib/utils/errors'
	import { type GridItemType, getGridTypeName, getSubstituteItemId } from './substitutionHelpers'

	interface Props {
		substitutions: Substitution[]
		type: GridItemType
		gridItemId: string | number | undefined
		partyId?: string
		partyShortcode?: string
		cap: number
	}

	let { substitutions, type, gridItemId, partyId, partyShortcode, cap }: Props = $props()

	const queryClient = useQueryClient()

	const existingSubstituteItemIds = $derived(
		substitutions.map(getSubstituteItemId).filter((id): id is string => id !== null)
	)

	const createSubstitution = useCreateSubstitution()
	const deleteSubstitution = useDeleteSubstitution()
	const reorderSubstitutions = useReorderSubstitutions()

	function handleAddSubstitute() {
		if (!partyId || !partyShortcode || !gridItemId) return
		if (substitutions.length >= cap) return
		const searchPaneId = `search-substitute-${gridItemId}`
		if (sidebar.paneStack.panes.some((p) => p.id === searchPaneId)) return
		sidebar.push({
			id: searchPaneId,
			title: m.substitution_add_prompt(),
			component: SearchContent,
			props: {
				type,
				canAddMore: true,
				excludedIds: existingSubstituteItemIds,
				onAddItems: (items: AddItemResult[]) => {
					const addItem = items[0]
					if (!addItem) return
					createSubstitution.mutate(
						{
							partyId: partyId!,
							partyShortcode: partyShortcode!,
							gridType: getGridTypeName(type),
							gridId: String(gridItemId),
							itemId: addItem.id
						},
						{
							onSuccess: () => sidebar.pop(),
							onError: (err) =>
								toast.error(extractErrorMessage(err, m.toast_failed_add_substitution()))
						}
					)
				}
			},
			onback: () => sidebar.pop()
		})
	}

	function handleDelete(sub: Substitution) {
		if (!partyId || !partyShortcode) return
		deleteSubstitution.mutate(
			{
				id: sub.id,
				partyId: partyId!,
				partyShortcode: partyShortcode!
			},
			{
				onError: (err) =>
					toast.error(extractErrorMessage(err, m.toast_failed_delete_substitution()))
			}
		)
	}

	let dragIndex = $state<number | null>(null)
	let hoverIndex = $state<number | null>(null)

	function onDragStart(e: DragEvent, index: number) {
		dragIndex = index
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move'
			e.dataTransfer.setData('text/plain', String(index))
		}
	}

	function onDragOver(e: DragEvent, index: number) {
		e.preventDefault()
		hoverIndex = index
		if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
	}

	function onDragLeave() {
		hoverIndex = null
	}

	async function onDrop(e: DragEvent, dropIndex: number) {
		e.preventDefault()
		const from = dragIndex
		dragIndex = null
		hoverIndex = null
		if (from === null || from === dropIndex) return
		if (!partyId || !partyShortcode) return

		const next = [...substitutions]
		const [moved] = next.splice(from, 1)
		if (!moved) return
		next.splice(dropIndex, 0, moved)

		try {
			await reorderSubstitutions.mutateAsync({
				partyId,
				partyShortcode,
				entries: next.map((sub, i) => ({ id: sub.id, position: i }))
			})
		} catch (err) {
			console.error('Failed to reorder substitutions:', err)
			toast.error(extractErrorMessage(err, m.toast_failed_reorder_substitution()))
			// The backend reorder is transactional, so on failure no positions
			// have moved. Refetch anyway to keep the UI in sync if the source
			// of the failure was a stale view.
			queryClient.invalidateQueries({
				queryKey: partyQueries.byShortcode(partyShortcode).queryKey
			})
		}
	}
</script>

{#if substitutions.length === 0}
	<div class="substitution-empty">
		<p class="empty">{m.substitution_empty()}</p>
		<Button variant="secondary" size="small" leftIcon="plus" onclick={handleAddSubstitute}>
			{m.substitution_add()}
		</Button>
	</div>
{:else}
	<div class="substitution-stack">
		<ol class="substitution-list">
			{#each substitutions as sub, index (sub.id)}
				<SubstitutionRow
					substitution={sub}
					{type}
					{index}
					isDropTarget={hoverIndex === index && dragIndex !== null && dragIndex !== index}
					{onDragStart}
					{onDragOver}
					{onDragLeave}
					{onDrop}
					onDelete={handleDelete}
				/>
			{/each}
		</ol>
		<div class="substitution-add">
			<Button
				variant="secondary"
				fullWidth
				leftIcon="plus"
				onclick={handleAddSubstitute}
				disabled={substitutions.length >= cap}
			>
				{m.substitution_add()}
			</Button>
		</div>
	</div>
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.substitution-empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: spacing.$unit;
		min-height: 10rem;
		padding: spacing.$unit-2x spacing.$unit;
	}

	.empty {
		font-size: typography.$font-small;
		color: var(--text-tertiary);
		margin: 0;
		text-align: center;
	}

	.substitution-stack {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;
	}

	.substitution-add {
		padding: 0 spacing.$unit;
	}

	.substitution-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-half;
	}
</style>
