import {
	createDragDropContext,
	type DragOperation
} from '$lib/composables/drag-drop.svelte'
import type { PartyMutations } from './party-mutations.svelte'
import type { Party } from '$lib/types/api/party'
import { toast } from 'svelte-sonner'
import { extractErrorMessage } from '$lib/utils/errors'

interface PartyDragDropOptions {
	mutations: PartyMutations
	getParty: () => Party
	canEdit: () => boolean
}

export function usePartyDragDrop(opts: PartyDragDropOptions) {
	let loading = $state(false)
	let error = $state<string | null>(null)

	async function handleSwap(source: DragOperation['source'], target: DragOperation['target']): Promise<void> {
		const party = opts.getParty()
		if (!party.id || party.id === 'new') {
			throw new Error('Cannot swap items in unsaved party')
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
			throw new Error('Cannot move items in unsaved party')
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

	async function handleDragOperation(operation: DragOperation) {
		if (!opts.canEdit()) return

		try {
			loading = true

			if (operation.type === 'swap') {
				await handleSwap(operation.source, operation.target)
			} else if (operation.type === 'move') {
				await handleMove(operation.source, operation.target)
			}
		} catch (err: any) {
			error = err.message || 'Failed to update party'
			console.error('Drag operation failed:', err)
			toast.error(extractErrorMessage(err, 'Drag operation failed'))
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
		}
	}
}
