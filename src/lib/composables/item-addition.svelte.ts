import type { PartyMutations } from './party-mutations.svelte'
import type { Party } from '$lib/types/api/party'
import type { AddItemResult } from '$lib/types/api/search'
import { GridType } from '$lib/types/enums'
import { findNextEmptySlot, SLOT_NOT_FOUND } from '$lib/utils/gridHelpers'
import { isConflictResponse, createConflictData, type ConflictData } from '$lib/types/api/conflict'

interface ItemAdditionOptions {
	mutations: PartyMutations
	getParty: () => Party
	canEdit: () => boolean
	getActiveTab: () => GridType
	getSelectedSlot: () => number
	setSelectedSlot: (n: number) => void
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
			let targetSlot = opts.getSelectedSlot()
			const activeTab = opts.getActiveTab()
			let result: unknown

			if (activeTab === GridType.Weapon) {
				result = await opts.mutations.grid.createWeapon.mutateAsync({
					partyId: party.id,
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
					summonId: item.granblueId,
					position: targetSlot,
					main: targetSlot === -1,
					friend: targetSlot === 6,
					collectionSummonId: item.collectionId
				})
			} else if (activeTab === GridType.Character) {
				result = await opts.mutations.grid.createCharacter.mutateAsync({
					partyId: party.id,
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

			// Find next empty slot for continuous adding
			// Re-read party to get post-mutation state; fall back to marking
			// the just-filled slot as occupied on the pre-mutation snapshot
			const currentParty = opts.getParty()
			const nextEmptySlot = findNextEmptySlot(currentParty, activeTab, targetSlot)
			if (nextEmptySlot !== SLOT_NOT_FOUND) {
				opts.setSelectedSlot(nextEmptySlot)
			}
		} catch (err: any) {
			error = err.message || 'Failed to add item'
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
