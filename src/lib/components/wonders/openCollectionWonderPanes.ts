/**
 * Openers for the profile's Wonder panes: one collected Wonder, and adding
 * a Wonder to the owner's collection.
 */
import { m } from '$lib/paraglide/messages'
import { sidebar } from '$lib/stores/sidebar.svelte'
import { wonderText } from '$lib/features/wonders/labels'
import { getWonderImage } from '$lib/utils/images/wonders'
import type { OwnedWonder, Wonder, WonderCatalogue } from '$lib/types/api/wonder'
import CollectionWonderPane from './CollectionWonderPane.svelte'
import CollectionWonderEditPane from './CollectionWonderEditPane.svelte'

export function openCollectionWonderPane(
	wonder: Wonder,
	row: OwnedWonder,
	catalogue: WonderCatalogue,
	isOwner: boolean
) {
	sidebar.openWithComponent(
		wonderText(wonder.name),
		CollectionWonderPane,
		{ wonder, row, catalogue, isOwner },
		{ scrollable: true, image: getWonderImage(row.image) }
	)
}

export function openAddCollectionWonderPane(catalogue: WonderCatalogue, owned: OwnedWonder[]) {
	sidebar.openWithComponent(
		m.wonders_add_title(),
		CollectionWonderEditPane,
		{ catalogue, mode: { kind: 'add', ownedIds: owned.map((row) => row.wonderId) } },
		{ scrollable: true }
	)
}
