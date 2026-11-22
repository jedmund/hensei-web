<script lang="ts">
	/**
	 * CollectionWonderPane - one collected Wonder: whether it's active, its
	 * uncap, level or recruited count, and what it does. Owners get Edit
	 * (pushes WonderSetupPane) and Remove in the overflow menu.
	 */
	import { onMount, untrack } from 'svelte'
	import { toast } from 'svelte-sonner'
	import { m } from '$lib/paraglide/messages'
	import DetailRow from '$lib/components/sidebar/details/DetailRow.svelte'
	import Switch from '$lib/components/ui/switch/Switch.svelte'
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte'
	import WonderImage from './WonderImage.svelte'
	import WonderDetails from './WonderDetails.svelte'
	import WonderSetupPane from './WonderSetupPane.svelte'
	import { sidebar } from '$lib/stores/sidebar.svelte'
	import {
		useRemoveCollectionWonder,
		useUpdateCollectionWonder
	} from '$lib/api/mutations/wonder.mutations'
	import { maxEvolutionFor, symbolumRecruitsUntilNext } from '$lib/features/wonders/wonders'
	import { wonderText } from '$lib/features/wonders/labels'
	import { extractErrorMessage } from '$lib/utils/errors'
	import { getBasePath } from '$lib/utils/images/core'
	import type { OwnedWonder, Wonder, WonderState } from '$lib/types/api/wonder'

	interface Props {
		paneId?: string
		wonder: Wonder
		row: OwnedWonder
		isOwner: boolean
	}

	let { paneId, wonder, row: initialRow, isOwner }: Props = $props()

	let row = $state(untrack(() => initialRow))
	let confirmOpen = $state(false)

	const removeMutation = useRemoveCollectionWonder()
	const updateMutation = useUpdateCollectionWonder()
	const name = $derived(wonderText(wonder.name))
	const inactive = $derived(row.active === false)

	function openEdit() {
		sidebar.push({
			id: `wonder-edit-${row.id}`,
			title: m.wonders_edit_title(),
			component: WonderSetupPane,
			props: { wonder, row, onSubmit: save },
			scrollable: true
		})
	}

	async function save(state: WonderState, active: boolean) {
		try {
			row = await updateMutation.mutateAsync({ id: row.id, input: { active, ...state } })
			toast.success(m.wonders_saved({ name }))
			sidebar.pop()
		} catch (err: unknown) {
			toast.error(extractErrorMessage(err, m.wonders_save_failed()))
		}
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

	const reliefBackgroundUrl = `${getBasePath()}/app/marketing/relief.png`

	onMount(() => {
		if (!isOwner || !paneId) return
		sidebar.setActionForPane(paneId, openEdit, m.action_edit())
		sidebar.setOverflowMenuForPane(paneId, [
			{ label: m.collection_remove_from(), handler: () => (confirmOpen = true), variant: 'danger' }
		])
	})
</script>

<div class="wonder-pane">
	<!-- The same relief header as the weapon and artifact panes -->
	<div
		class="wonder-header"
		style:background-image="url({reliefBackgroundUrl}), linear-gradient(to right, #000, #484440,
		#000)"
	>
		<WonderImage image={row.image} alt={name} size={120} {inactive} />
	</div>

	<div class="status">
		<DetailRow label={m.wonders_active_label()} compact>
			<Switch checked={!inactive} disabled size="small" />
		</DetailRow>
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
		{:else if wonder.kind === 'scaling' && isOwner}
			<!-- The count is the owner's; visitors see only the bonus it gives -->
			<DetailRow label={m.wonders_recruited_label()} value={row.possession ?? '—'} />
			{@const untilNext = symbolumRecruitsUntilNext(row.possession)}
			{#if untilNext !== null}
				<DetailRow
					label={m.wonders_recruits_until_next()}
					value={m.wonders_recruits_until_next_value({ count: untilNext })}
				/>
			{/if}
		{/if}
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
	@use '$src/themes/layout' as *;

	.wonder-pane {
		display: flex;
		flex-direction: column;
		gap: $unit-3x;
		padding: $unit-2x 0;
	}

	.wonder-header {
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0 $unit-2x;
		padding: $unit-3x 0;
		border-radius: $card-corner;
		background-size: 420px 731px;
		background-position: -20px -20px;
		overflow: hidden;
	}

	.status {
		display: flex;
		flex-direction: column;
		padding: 0 $unit;
	}
</style>
