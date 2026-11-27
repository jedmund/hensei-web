/**
 * Drag and drop on the spark page, through the shared drag-and-drop context:
 * tiles move between and within the board's sections, and items drag from
 * the picker pane into a section. The page owns the context and hands it to
 * the pane, which renders in the sidebar outside the page's component tree.
 */

import { createDragDropContext, type DragDropContext } from '$lib/composables/drag-drop.svelte'
import { SPARK_COLUMNS, type SparkColumn, type SparkMark } from '$lib/features/spark/spark'
import { gachaItemKind } from '$lib/utils/gacha'
import type { CatalogueItem } from '$lib/types/gacha'

/** The picker pane's container; it's a source only, never a drop target */
export const SPARK_PICKER = 'picker'

/**
 * Drops are only valid between slots of the same type, so characters move
 * between new characters and gold moons and summons stay with summons
 */
export type SparkDragType = 'character' | 'summon'

export interface SparkDragItem {
	id: string
	item: CatalogueItem
}

export type SparkDrag = DragDropContext<SparkDragItem, SparkDragType>

export const columnDragType = (column: SparkColumn): SparkDragType =>
	column === 'summons' ? 'summon' : 'character'

export const itemDragType = (item: CatalogueItem): SparkDragType =>
	gachaItemKind(item) === 'summon' ? 'summon' : 'character'

const asColumn = (container: string) => SPARK_COLUMNS.find((column) => column === container) ?? null

interface SparkDragHandlers {
	/** A tile moved within the board */
	onMove: (from: SparkMark, to: SparkMark) => void
	/** An item from the pane landed in a section */
	onInsert: (item: CatalogueItem, to: SparkMark) => void
	itemLabel: (item: CatalogueItem) => string
}

export function createSparkDrag({ onMove, onInsert, itemLabel }: SparkDragHandlers): SparkDrag {
	function drop(
		from: { container: string; position: number },
		to: { container: string; position: number },
		dragged: SparkDragItem
	) {
		const toColumn = asColumn(to.container)
		if (!toColumn) return
		const target = { column: toColumn, index: to.position }
		if (from.container === SPARK_PICKER) {
			onInsert(dragged.item, target)
			return
		}
		const fromColumn = asColumn(from.container)
		if (fromColumn) onMove({ column: fromColumn, index: from.position }, target)
	}

	return createDragDropContext<SparkDragItem, SparkDragType>({
		itemLabel: (dragged) => itemLabel(dragged.item),
		onDrop: drop,
		onSwap: (from, to, dragged) => drop(from, to, dragged)
	})
}
