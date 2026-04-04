import type { PartyMutations } from './party-mutations.svelte'
import type { Party } from '$lib/types/api/party'
import type { AddItemResult } from '$lib/types/api/search'
import { GridType } from '$lib/types/enums'
import { findNextEmptySlot, SLOT_NOT_FOUND } from '$lib/utils/gridHelpers'
import { sidebar } from '$lib/stores/sidebar.svelte'
import { isConflictResponse, createConflictData, type ConflictData } from '$lib/types/api/conflict'
import { toast } from 'svelte-sonner'
import { localizedName } from '$lib/utils/locale'
import {
	getCharacterImage,
	getWeaponImage,
	getSummonImage
} from '$lib/features/database/detail/image'
import SelectionToast from '$lib/components/ui/SelectionToast.svelte'
import * as m from '$lib/paraglide/messages'

interface ItemAdditionOptions {
	mutations: PartyMutations
	getParty: () => Party
	canEdit: () => boolean
	getActiveTab: () => GridType
	getSelectedSlot: () => number
	setSelectedSlot: (n: number) => void
	onSlotAdvance?: (newSlot: number) => void
	ensurePartyExists?: () => Promise<{ id: string; shortcode: string }>
}

export function useItemAddition(opts: ItemAdditionOptions) {
	let loading = $state(false)
	let error = $state<string | null>(null)
	let conflictDialogOpen = $state(false)
	let conflictData = $state<ConflictData | null>(null)

	async function handleAddItems(items: AddItemResult[]) {
		if (items.length === 0 || !opts.canEdit()) return

		const item = items[0]
		if (!item) return

		// Ensure party exists (no-op for edit route, creates party for new route)
		let party = opts.getParty()
		if (party.id === 'new' && opts.ensurePartyExists) {
			await opts.ensurePartyExists()
			party = opts.getParty() // Re-read after creation
		}

		if (!party.id || party.id === 'new') return

		loading = true
		error = null

		try {
			const targetSlot = opts.getSelectedSlot()
			const activeTab = opts.getActiveTab()
			const existingItem = findItemAtSlot(party, activeTab, targetSlot)
			const isReplacing = existingItem != null
			let result: unknown

			if (activeTab === GridType.Weapon) {
				result = await opts.mutations.grid.createWeapon.mutateAsync({
					partyId: party.id,
					partyShortcode: party.shortcode,
					weaponId: item.granblueId,
					position: targetSlot,
					mainhand: targetSlot === -1,
					collectionWeaponId: item.collectionId
				})

				if (isConflictResponse(result)) {
					conflictData = createConflictData(result, 'weapon')
					conflictDialogOpen = true
					return
				}
			} else if (activeTab === GridType.Summon) {
				await opts.mutations.grid.createSummon.mutateAsync({
					partyId: party.id,
					partyShortcode: party.shortcode,
					summonId: item.granblueId,
					position: targetSlot,
					main: targetSlot === -1,
					friend: targetSlot === 6,
					collectionSummonId: item.collectionId
				})
			} else if (activeTab === GridType.Character) {
				result = await opts.mutations.grid.createCharacter.mutateAsync({
					partyId: party.id,
					partyShortcode: party.shortcode,
					characterId: item.granblueId,
					position: targetSlot,
					collectionCharacterId: item.collectionId
				})

				if (isConflictResponse(result)) {
					conflictData = createConflictData(result, 'character')
					conflictDialogOpen = true
					return
				}
			}

			// Show confirmation toast
			const itemName = localizedName(item.name)
			const imageUrl =
				activeTab === GridType.Character
					? getCharacterImage(item.granblueId, 'square')
					: activeTab === GridType.Weapon
						? getWeaponImage(item.granblueId, 'square')
						: getSummonImage(item.granblueId, 'square')
			const originalName = isReplacing ? localizedName(existingItem.name) : undefined
			const message = isReplacing
				? m.toast_item_replaced({ original: originalName!, name: itemName })
				: m.toast_item_equipped({ name: itemName })
			toast.custom(SelectionToast, {
				componentProps: {
					itemName,
					message,
					imageUrl,
					imageClass: 'square',
					boldNames: originalName ? [originalName] : undefined
				}
			})

			if (isReplacing) {
				// Close sidebar after replacement
				sidebar.close()
			} else {
				// Find next empty slot for continuous adding
				const currentParty = opts.getParty()
				const nextEmptySlot = findNextEmptySlot(currentParty, activeTab, targetSlot)
				if (nextEmptySlot !== SLOT_NOT_FOUND) {
					opts.setSelectedSlot(nextEmptySlot)
					opts.onSlotAdvance?.(nextEmptySlot)
				}
			}
		} catch (err: unknown) {
			error = err instanceof Error ? err.message : 'Failed to add item'
		} finally {
			loading = false
		}
	}

	function resolveConflict() {
		conflictData = null
		const nextEmptySlot = findNextEmptySlot(opts.getParty(), opts.getActiveTab())
		if (nextEmptySlot !== SLOT_NOT_FOUND) opts.setSelectedSlot(nextEmptySlot)
	}

	function cancelConflict() {
		conflictData = null
	}

	return {
		handleAddItems,
		get loading() {
			return loading
		},
		get error() {
			return error
		},
		set error(v: string | null) {
			error = v
		},
		get conflictDialogOpen() {
			return conflictDialogOpen
		},
		set conflictDialogOpen(v: boolean) {
			conflictDialogOpen = v
		},
		get conflictData() {
			return conflictData
		},
		resolveConflict,
		cancelConflict
	}
}

interface NamedItem {
	name: { en?: string; ja?: string }
}

function findItemAtSlot(party: Party, gridType: GridType, position: number): NamedItem | undefined {
	if (gridType === GridType.Weapon) {
		const gw = party.weapons.find((w) => w.position === position || (position === -1 && w.mainhand))
		return gw?.weapon
	}
	if (gridType === GridType.Summon) {
		const gs = party.summons.find(
			(s) => s.position === position || (position === -1 && s.main) || (position === 6 && s.friend)
		)
		return gs?.summon
	}
	const gc = party.characters.find((c) => c.position === position)
	return gc?.character
}
