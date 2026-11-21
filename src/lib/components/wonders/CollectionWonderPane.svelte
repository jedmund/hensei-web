<script lang="ts">
	/**
	 * CollectionWonderPane - one collected Wonder: whether it's active, its
	 * uncap, level or recruited count, and what it does. Owners get Edit
	 * (pushes CollectionWonderEditPane) and Remove in the overflow menu.
	 */
	import { onMount, untrack } from 'svelte'
	import { toast } from 'svelte-sonner'
	import { m } from '$lib/paraglide/messages'
	import DetailRow from '$lib/components/sidebar/details/DetailRow.svelte'
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte'
	import WonderImage from './WonderImage.svelte'
	import WonderDetails from './WonderDetails.svelte'
	import CollectionWonderEditPane from './CollectionWonderEditPane.svelte'
	import { sidebar } from '$lib/stores/sidebar.svelte'
	import { useRemoveCollectionWonder } from '$lib/api/mutations/wonder.mutations'
	import { maxEvolutionFor } from '$lib/features/wonders/wonders'
	import { wonderText } from '$lib/features/wonders/labels'
	import { extractErrorMessage } from '$lib/utils/errors'
	import type { OwnedWonder, Wonder, WonderCatalogue } from '$lib/types/api/wonder'

	interface Props {
		paneId?: string
		wonder: Wonder
		row: OwnedWonder
		catalogue: WonderCatalogue
		isOwner: boolean
	}

	let { paneId, wonder, row: initialRow, catalogue, isOwner }: Props = $props()

	let row = $state(untrack(() => initialRow))
	let confirmOpen = $state(false)

	const removeMutation = useRemoveCollectionWonder()
	const name = $derived(wonderText(wonder.name))
	const inactive = $derived(row.active === false)

	function openEdit() {
		sidebar.push({
			id: `wonder-edit-${row.id}`,
			title: m.wonders_edit_title(),
			component: CollectionWonderEditPane,
			props: {
				catalogue,
				mode: { kind: 'edit', row },
				onSaved: (saved: OwnedWonder) => (row = saved)
			},
			scrollable: true
		})
	}

	async function remove() {
		try {
			await removeMutation.mutateAsync(row.id)
			confirmOpen = false
			toast.success(m.wonders_removed({ name }))
			sidebar.close()
		} catch (err: unknown) {
			toast.error(extractErrorMessage(err, m.wonders_remove_failed()))
		}
	}

	onMount(() => {
		if (!isOwner || !paneId) return
		sidebar.setActionForPane(paneId, openEdit, m.action_edit())
		sidebar.setOverflowMenuForPane(paneId, [
			{ label: m.collection_remove_from(), handler: () => (confirmOpen = true), variant: 'danger' }
		])
	})
</script>

<div class="wonder-pane">
	<div class="overview">
		<WonderImage image={row.image} alt={name} size={96} {inactive} />
		<div class="status">
			<DetailRow
				label={m.wonders_active_label()}
				value={inactive ? m.wonders_inactive() : m.wonders_active_label()}
			/>
			{#if wonder.kind === 'leveled'}
				{#if maxEvolutionFor(wonder) > 0}
					<DetailRow
						label={m.wonders_uncap_label()}
						value={m.wonders_uncap_value({
							evolution: row.evolution ?? 0,
							max: maxEvolutionFor(wonder)
						})}
					/>
				{/if}
				<DetailRow label={m.wonders_level_label()} value={row.level ?? '—'} />
			{:else if wonder.kind === 'scaling'}
				<DetailRow label={m.wonders_recruited_label()} value={row.possession ?? '—'} />
			{/if}
		</div>
	</div>

	<WonderDetails {wonder} bonuses={row.bonuses} />
</div>

<ConfirmDialog
	bind:open={confirmOpen}
	title={m.collection_remove_from()}
	message={m.wonders_remove_confirm({ name })}
	confirmLabel={m.collection_remove_from()}
	loading={removeMutation.isPending}
	onconfirm={remove}
/>

<style lang="scss">
	@use '$src/themes/spacing' as *;

	.wonder-pane {
		display: flex;
		flex-direction: column;
		gap: $unit-3x;
		padding: $unit-2x 0;
	}

	.overview {
		display: flex;
		align-items: flex-start;
		gap: $unit-2x;
		padding: 0 $unit-2x;
	}

	.status {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
	}
</style>
