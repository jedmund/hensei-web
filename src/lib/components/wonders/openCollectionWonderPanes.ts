/**
 * Openers for the profile's Wonder panes: one collected Wonder, and adding
 * a Wonder to the owner's collection.
 */
import { toast } from 'svelte-sonner'
import { m } from '$lib/paraglide/messages'
import { sidebar } from '$lib/stores/sidebar.svelte'
import { wonderText } from '$lib/features/wonders/labels'
import { extractErrorMessage } from '$lib/utils/errors'
import { getWonderImage } from '$lib/utils/images/wonders'
import type { useAddCollectionWonder } from '$lib/api/mutations/wonder.mutations'
import type { OwnedWonder, Wonder, WonderCatalogue, WonderState } from '$lib/types/api/wonder'
import CollectionWonderPane from './CollectionWonderPane.svelte'
import WonderPickerPane from './WonderPickerPane.svelte'

export function openCollectionWonderPane(wonder: Wonder, row: OwnedWonder, isOwner: boolean) {
	sidebar.openWithComponent(
		wonderText(wonder.name),
		CollectionWonderPane,
		{ wonder, row, isOwner },
		{ scrollable: true, image: getWonderImage(row.image) }
	)
}

/** Offers the Wonders the owner doesn't have; adding one closes the sidebar. */
export function openAddCollectionWonderPane(
	catalogue: WonderCatalogue,
	owned: OwnedWonder[],
	mutation: ReturnType<typeof useAddCollectionWonder>
) {
	const ownedIds = new Set(owned.map((row) => row.wonderId))

	async function add(wonder: Wonder, state: WonderState, active: boolean) {
		try {
			await mutation.mutateAsync({ wonderId: wonder.id, active, ...state })
			toast.success(m.wonders_added({ name: wonderText(wonder.name) }))
			sidebar.close()
		} catch (err: unknown) {
			toast.error(extractErrorMessage(err, m.wonders_save_failed()))
		}
	}

	sidebar.openWithComponent(
		m.wonders_add_title(),
		WonderPickerPane,
		{
			catalogue,
			candidates: catalogue.wonders.filter((w) => !ownedIds.has(w.id)),
			emptyMessage: m.wonders_all_owned(),
			onAdd: add
		},
		{ scrollable: true }
	)
}
