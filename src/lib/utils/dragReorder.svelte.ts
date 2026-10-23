/**
 * HTML5 drag-and-drop reorder for a single list. Owns the drag/hover index
 * state and emits the reordered array to the caller, which decides how to
 * persist the change.
 *
 * @example
 * ```ts
 * const drag = useDragReorder({
 *   items: () => sortedRoles,
 *   onReorder: (next) => {
 *     reorderMut.mutate(next.map((r, i) => ({ id: r.id, sortOrder: i + 1 })))
 *   }
 * })
 *
 * <li
 *   draggable="true"
 *   class:drop-target={drag.isDropTarget(index)}
 *   ondragstart={(e) => drag.onDragStart(e, index)}
 *   ondragover={(e) => drag.onDragOver(e, index)}
 *   ondragleave={drag.onDragLeave}
 *   ondrop={(e) => drag.onDrop(e, index)}
 * >
 * ```
 */

export interface DragReorderOptions<T> {
	/** Reactive accessor for the current list. */
	items: () => readonly T[]
	/** Called with the post-reorder list. Receives the source/destination indices for callers that need them. */
	onReorder: (next: T[], from: number, to: number) => void | Promise<void>
}

export interface DragReorderHandle {
	readonly dragIndex: number | null
	readonly hoverIndex: number | null
	isDropTarget(index: number): boolean
	onDragStart(e: DragEvent, index: number): void
	onDragOver(e: DragEvent, index: number): void
	onDragLeave(): void
	onDrop(e: DragEvent, index: number): Promise<void>
}

export function useDragReorder<T>(opts: DragReorderOptions<T>): DragReorderHandle {
	let dragIndex = $state<number | null>(null)
	let hoverIndex = $state<number | null>(null)

	function onDragStart(e: DragEvent, index: number) {
		dragIndex = index
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move'
			e.dataTransfer.setData('text/plain', String(index))
		}
	}

	function onDragOver(e: DragEvent, index: number) {
		e.preventDefault()
		hoverIndex = index
		if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
	}

	function onDragLeave() {
		hoverIndex = null
	}

	async function onDrop(e: DragEvent, dropIndex: number) {
		e.preventDefault()
		const from = dragIndex
		dragIndex = null
		hoverIndex = null
		if (from === null || from === dropIndex) return

		const next = [...opts.items()]
		const [moved] = next.splice(from, 1)
		if (!moved) return
		next.splice(dropIndex, 0, moved)

		await opts.onReorder(next, from, dropIndex)
	}

	return {
		get dragIndex() {
			return dragIndex
		},
		get hoverIndex() {
			return hoverIndex
		},
		isDropTarget(index: number) {
			return hoverIndex === index && dragIndex !== null && dragIndex !== index
		},
		onDragStart,
		onDragOver,
		onDragLeave,
		onDrop
	}
}
