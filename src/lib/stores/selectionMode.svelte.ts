/**
 * Selection mode store for collection bulk operations.
 * Used to manage multi-select state across collection pages.
 */
import { SvelteSet } from 'svelte/reactivity'

export type EntityType = 'characters' | 'weapons' | 'summons' | 'artifacts'

export interface SelectionModeContext {
	readonly isActive: boolean
	readonly entityType: EntityType | null
	readonly selectedIds: Set<string>
	readonly selectedCount: number
	enter: (type: EntityType) => void
	exit: () => void
	toggle: (id: string) => void
	selectAll: (ids: string[]) => void
	clearSelection: () => void
	isSelected: (id: string) => boolean
}

/**
 * Creates a selection mode context for managing bulk selection state.
 * Should be created in the collection layout and provided via Svelte context.
 */
export function createSelectionModeContext(): SelectionModeContext {
	let isActive = $state(false)
	let entityType = $state<EntityType | null>(null)
	const selectedIds = new SvelteSet<string>()

	return {
		get isActive() {
			return isActive
		},
		get entityType() {
			return entityType
		},
		get selectedIds() {
			return selectedIds
		},
		get selectedCount() {
			return selectedIds.size
		},

		enter(type: EntityType) {
			isActive = true
			entityType = type
			selectedIds.clear()
		},

		exit() {
			isActive = false
			entityType = null
			selectedIds.clear()
		},

		toggle(id: string) {
			if (selectedIds.has(id)) {
				selectedIds.delete(id)
			} else {
				selectedIds.add(id)
			}
		},

		selectAll(ids: string[]) {
			selectedIds.clear()
			for (const id of ids) {
				selectedIds.add(id)
			}
		},

		clearSelection() {
			selectedIds.clear()
		},

		isSelected(id: string) {
			return selectedIds.has(id)
		}
	}
}

export const SELECTION_MODE_KEY = Symbol('selection-mode')

/** Context key for child pages to provide their loaded item IDs to the layout */
export const LOADED_IDS_KEY = Symbol('loaded-ids')

export interface LoadedIdsContext {
	setIds: (ids: string[]) => void
}
