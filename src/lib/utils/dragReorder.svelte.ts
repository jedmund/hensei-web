/**
 * Reorder for a single list: HTML5 drag-and-drop, plus a keyboard grab for
 * the same list. Owns the drag/hover/grab state and emits the reordered
 * array to the caller, which decides how to persist the change.
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
 *
 * Keyboard (`onKeydown` on a row's grip button): Space or Enter picks the
 * row up, ↑/↓ move it (shown through `onPreview`), Space or Enter drops it
 * (`onReorder`), Escape puts it back. Alt+↑/↓ moves it one place at once.
 */

export interface DragReorderOptions<T> {
	/** Reactive accessor for the current list. */
	items: () => readonly T[]
	/** Called with the post-reorder list. Receives the source/destination indices for callers that need them. */
	onReorder: (next: T[], from: number, to: number) => void | Promise<void>
	/**
	 * Shows a keyboard move before it's dropped (and the original order again
	 * on Escape). Without it, keyboard moves while grabbed commit each step.
	 */
	onPreview?: (next: T[]) => void
}

/** What a keydown did, so the caller can refocus the moved row and announce it */
export type KeyboardReorderResult =
	| { kind: 'grab'; index: number }
	| { kind: 'move'; index: number }
	| { kind: 'drop'; index: number }
	| { kind: 'cancel'; index: number }

export interface DragReorderHandle {
	readonly dragIndex: number | null
	readonly hoverIndex: number | null
	/** The row picked up with the keyboard */
	readonly grabbedIndex: number | null
	isDropTarget(index: number): boolean
	onDragStart(e: DragEvent, index: number): void
	onDragOver(e: DragEvent, index: number): void
	onDragLeave(): void
	onDrop(e: DragEvent, index: number): Promise<void>
	onKeydown(e: KeyboardEvent, index: number): KeyboardReorderResult | null
}

/** A copy of `items` with the item at `from` moved to `to` */
export function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
	const next = [...items]
	const [moved] = next.splice(from, 1)
	if (moved === undefined) return next
	next.splice(to, 0, moved)
	return next
}

export function useDragReorder<T>(opts: DragReorderOptions<T>): DragReorderHandle {
	let dragIndex = $state<number | null>(null)
	let hoverIndex = $state<number | null>(null)
	let grabbedIndex = $state<number | null>(null)
	// Where the grabbed row started, and the list before it moved
	let grabStart: { index: number; items: T[] } | null = null

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

		const items = opts.items()
		if (!items[from]) return
		await opts.onReorder(moveItem(items, from, dropIndex), from, dropIndex)
	}

	function onKeydown(e: KeyboardEvent, index: number): KeyboardReorderResult | null {
		const items = opts.items()
		const up = e.key === 'ArrowUp'
		const down = e.key === 'ArrowDown'
		const toggle = e.key === ' ' || e.key === 'Enter'

		if (grabbedIndex === null) {
			if (toggle) {
				e.preventDefault()
				grabbedIndex = index
				grabStart = { index, items: [...items] }
				return { kind: 'grab', index }
			}
			if ((up || down) && e.altKey) {
				e.preventDefault()
				const to = up ? index - 1 : index + 1
				if (to < 0 || to >= items.length) return null
				void opts.onReorder(moveItem(items, index, to), index, to)
				return { kind: 'move', index: to }
			}
			return null
		}

		if (up || down) {
			e.preventDefault()
			const to = up ? grabbedIndex - 1 : grabbedIndex + 1
			if (to < 0 || to >= items.length) return null
			const next = moveItem(items, grabbedIndex, to)
			if (opts.onPreview) opts.onPreview(next)
			else void opts.onReorder(next, grabbedIndex, to)
			grabbedIndex = to
			return { kind: 'move', index: to }
		}

		if (toggle || e.key === 'Tab') {
			// Tab drops too, so focus never leaves a row hanging
			if (toggle) e.preventDefault()
			const to = grabbedIndex
			const start = grabStart
			grabbedIndex = null
			grabStart = null
			if (start && opts.onPreview && start.index !== to) {
				void opts.onReorder([...items], start.index, to)
			}
			return { kind: 'drop', index: to }
		}

		if (e.key === 'Escape') {
			e.preventDefault()
			const start = grabStart
			grabbedIndex = null
			grabStart = null
			if (start) {
				if (opts.onPreview) opts.onPreview(start.items)
				else void opts.onReorder(start.items, index, start.index)
			}
			return { kind: 'cancel', index: start?.index ?? index }
		}

		return null
	}

	return {
		get dragIndex() {
			return dragIndex
		},
		get hoverIndex() {
			return hoverIndex
		},
		get grabbedIndex() {
			return grabbedIndex
		},
		isDropTarget(index: number) {
			return hoverIndex === index && dragIndex !== null && dragIndex !== index
		},
		onDragStart,
		onDragOver,
		onDragLeave,
		onDrop,
		onKeydown
	}
}
