import {
	createDragDropContext,
	type DragOperation
} from '$lib/composables/drag-drop.svelte'
import type { PartyMutations } from './party-mutations.svelte'
import type { Party, GridWeapon, GridSummon } from '$lib/types/api/party'
import { toast } from 'svelte-sonner'
import { extractErrorMessage } from '$lib/utils/errors'
import * as m from '$lib/paraglide/messages'
import { findNextEmptySlot, SLOT_NOT_FOUND } from '$lib/utils/gridHelpers'
import { GridType } from '$lib/types/enums'

export interface PendingDuplicate {
	sourceId: string
	position: number
	type: 'weapon' | 'summon'
}

interface PartyDragDropOptions {
	mutations: PartyMutations
	getParty: () => Party
	canEdit: () => boolean
	getActiveTab?: () => GridType
	setSelectedSlot?: (n: number) => void
}

export function usePartyDragDrop(opts: PartyDragDropOptions) {
	let loading = $state(false)
	let error = $state<string | null>(null)
	let pendingDuplicate = $state<PendingDuplicate | null>(null)

	async function handleSwap(source: DragOperation['source'], target: DragOperation['target']): Promise<void> {
		const party = opts.getParty()
		if (!party.id || party.id === 'new') {
			throw new Error(m.toast_unsaved_swap())
		}

		const swapParams = {
			partyId: party.id,
			partyShortcode: party.shortcode,
			sourceId: source.itemId,
			targetId: target.itemId
		}

		if (source.type === 'weapon') {
			await opts.mutations.grid.swapWeapons.mutateAsync(swapParams)
		} else if (source.type === 'character') {
			await opts.mutations.grid.swapCharacters.mutateAsync(swapParams)
		} else if (source.type === 'summon') {
			await opts.mutations.grid.swapSummons.mutateAsync(swapParams)
		}
	}

	async function handleMove(source: DragOperation['source'], target: DragOperation['target']): Promise<void> {
		const party = opts.getParty()
		if (!party.id || party.id === 'new') {
			throw new Error(m.toast_unsaved_move())
		}

		const updateParams = {
			id: source.itemId,
			partyShortcode: party.shortcode,
			updates: { position: target.position }
		}

		if (source.type === 'weapon') {
			await opts.mutations.grid.updateWeapon.mutateAsync(updateParams)
		} else if (source.type === 'character') {
			await opts.mutations.grid.updateCharacter.mutateAsync(updateParams)
		} else if (source.type === 'summon') {
			await opts.mutations.grid.updateSummon.mutateAsync(updateParams)
		}
	}

	async function handleDuplicate(source: DragOperation['source'], target: DragOperation['target']): Promise<void> {
		const party = opts.getParty()
		if (!party.id || party.id === 'new') {
			throw new Error(m.toast_unsaved_duplicate())
		}

		// If the source is collection-linked, defer to the dialog
		if (source.collectionLinked) {
			pendingDuplicate = {
				sourceId: source.itemId,
				position: target.position,
				type: source.type as 'weapon' | 'summon'
			}
			return
		}

		await executeDuplicate(source.itemId, target.position, source.type as 'weapon' | 'summon')
	}

	async function executeDuplicate(sourceId: string, position: number, type: 'weapon' | 'summon') {
		const party = opts.getParty()
		if (type === 'weapon') {
			await opts.mutations.grid.duplicateWeapon.mutateAsync({
				id: sourceId,
				partyShortcode: party.shortcode,
				position
			})
		} else if (type === 'summon') {
			await opts.mutations.grid.duplicateSummon.mutateAsync({
				id: sourceId,
				partyShortcode: party.shortcode,
				position
			})
		}

		advanceSelectedSlot(type, position)
	}

	function advanceSelectedSlot(type: 'weapon' | 'summon', filledSlot: number) {
		if (!opts.setSelectedSlot) return
		const gridType = type === 'weapon' ? GridType.Weapon : GridType.Summon
		const nextSlot = findNextEmptySlot(opts.getParty(), gridType, filledSlot)
		if (nextSlot !== SLOT_NOT_FOUND) {
			opts.setSelectedSlot(nextSlot)
		}
	}

	async function confirmDuplicate() {
		if (!pendingDuplicate) return
		const { sourceId, position, type } = pendingDuplicate
		pendingDuplicate = null
		try {
			loading = true
			await executeDuplicate(sourceId, position, type)
		} catch (err: any) {
			error = err.message || m.toast_failed_duplicate()
			console.error('Duplicate failed:', err)
			toast.error(extractErrorMessage(err, m.toast_failed_duplicate()))
		} finally {
			loading = false
		}
	}

	function cancelDuplicate() {
		pendingDuplicate = null
	}

	function isSlotOccupied(type: string, position: number): boolean {
		const party = opts.getParty()
		if (type === 'weapon') {
			return party.weapons.some((w: GridWeapon) => w.position === position)
		}
		if (type === 'summon') {
			return party.summons.some((s: GridSummon) => s.position === position)
		}
		return false
	}

	function isSourceLimited(type: string, itemId: string): boolean {
		if (type !== 'weapon') return false
		const party = opts.getParty()
		const weapon = party.weapons.find((w: GridWeapon) => w.id === itemId)
		return !!weapon?.weapon?.limit
	}

	async function handleDragOperation(operation: DragOperation) {
		if (!opts.canEdit()) return

		try {
			loading = true

			if (operation.type === 'swap') {
				await handleSwap(operation.source, operation.target)
			} else if (operation.type === 'move') {
				await handleMove(operation.source, operation.target)
			} else if (operation.type === 'duplicate') {
				await handleDuplicate(operation.source, operation.target)
			}
		} catch (err: any) {
			error = err.message || m.toast_failed_update_party()
			console.error('Drag operation failed:', err)
			toast.error(extractErrorMessage(err, m.toast_drag_failed()))
		} finally {
			loading = false
			dragContext.clearQueue()
		}
	}

	const dragContext = createDragDropContext({
		onLocalUpdate: async (operation) => {
			await handleDragOperation(operation)
		},
		onValidate: (source, target) => {
			if (source.type !== target.type) return false

			if (source.type === 'character' && target.container === 'main-characters') {
				return true
			}

			if (target.type === 'weapon' && target.position === -1) return false
			if (target.type === 'summon' && (target.position === -1 || target.position === 6))
				return false

			// In duplicate mode, reject occupied target slots and limited weapons
			if (dragContext.state.isDuplicating) {
				if (isSlotOccupied(target.type, target.position)) return false
				const draggedItemId = dragContext.state.draggedItem?.data.id
				if (draggedItemId && isSourceLimited(source.type, draggedItemId)) return false
			}

			return true
		}
	})

	return {
		dragContext,
		get loading() {
			return loading
		},
		get error() {
			return error
		},
		get pendingDuplicate() {
			return pendingDuplicate
		},
		confirmDuplicate,
		cancelDuplicate
	}
}
