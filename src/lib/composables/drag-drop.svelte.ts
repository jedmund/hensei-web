/**
 * Drag and drop between slots in one or more containers: the party grids,
 * the Solomonis unseal priority lists and the spark maker's sections. Mouse
 * drags use HTML5 drag events, touch drags a long press, both through the
 * shared DraggableItem and DropZone components.
 *
 * Items only need an id. Each source and target carries a type, and a drop
 * is only valid between slots of the same type. Behavior specific to the
 * party grid (Alt-drag duplicates, collection links) is opt-in.
 */

import type { GridCharacter, GridWeapon, GridSummon } from '$lib/types/api/party'
import { uuid } from '$lib/utils/uuid'
import { getLocale } from '$lib/paraglide/runtime'

export type GridItemType = 'character' | 'weapon' | 'summon'
export type GridItem = GridCharacter | GridWeapon | GridSummon

/** The touch drag preview's label for a party grid item, in the page's language */
export function gridItemLabel(item: GridItem): string {
	const name =
		'character' in item
			? item.character.name
			: 'weapon' in item
				? item.weapon.name
				: 'summon' in item
					? item.summon.name
					: undefined
	return (getLocale() === 'ja' && name?.ja) || name?.en || 'Item'
}

/** Whether a party grid item is linked to the user's collection */
export function isGridItemCollectionLinked(item: GridItem): boolean {
	if ('weapon' in item) return !!(item as GridWeapon).collectionWeaponId
	if ('summon' in item) return !!(item as GridSummon).collectionSummonId
	return false
}

/** Anything that can be dragged */
export interface DragItem {
	id: string
}

export interface Position {
	container: string
	position: number
}

export interface DragSource<K extends string = GridItemType> extends Position {
	type: K
}

export interface DraggedItem<T extends DragItem = GridItem, K extends string = GridItemType> {
	type: K
	data: T
	source: DragSource<K>
}

export interface DropTarget<K extends string = GridItemType> extends Position {
	type: K
}

export interface DragOperation<K extends string = GridItemType> {
	id: string
	type: 'move' | 'swap' | 'reorder' | 'duplicate'
	timestamp: number
	source: {
		container: string
		position: number
		itemId: string
		type?: K | undefined
		collectionLinked?: boolean | undefined
	}
	target: {
		container: string
		position: number
		itemId?: string | undefined
		type?: K | undefined
	}
}

export interface PendingDragData<T extends DragItem = GridItem, K extends string = GridItemType> {
	item: T
	source: Position
	type: K
}

export interface TouchState<T extends DragItem = GridItem, K extends string = GridItemType> {
	touchStartPos: { x: number; y: number } | null
	touchStartTime: number
	longPressTimer: number | null
	touchThreshold: number
	longPressDuration: number
	currentTouch: PendingDragData<T, K> | null
}

export interface DragDropState<T extends DragItem = GridItem, K extends string = GridItemType> {
	isDragging: boolean
	isDuplicating: boolean
	draggedItem: DraggedItem<T, K> | null
	hoveredOver: DropTarget<K> | null
	validDrop: boolean
	dragPreview: HTMLElement | null
	lastError: Error | null
	touchState: TouchState<T, K>
}

export interface DragDropHandlers<T extends DragItem = GridItem, K extends string = GridItemType> {
	onDrop?: (from: DragSource<K>, to: DropTarget<K>, item: T) => void
	onSwap?: (from: DragSource<K>, to: DropTarget<K>, fromItem: T, toItem: T) => void
	onValidate?: (from: DragSource<K>, to: DropTarget<K>) => boolean
	onLocalUpdate?: (operation: DragOperation<K>) => void
	/** The label on the touch drag preview */
	itemLabel?: (item: T) => string
	/** Alt-drag duplicates instead of moving. Off unless set. */
	allowDuplicate?: boolean
	/** Whether a duplicated item is linked to the user's collection */
	isCollectionLinked?: (item: T) => boolean
}

export function createDragDropContext<
	T extends DragItem = GridItem,
	K extends string = GridItemType
>(handlers: DragDropHandlers<T, K> = {}) {
	const state = $state<DragDropState<T, K>>({
		isDragging: false,
		isDuplicating: false,
		draggedItem: null,
		hoveredOver: null,
		validDrop: false,
		dragPreview: null,
		lastError: null,
		touchState: {
			touchStartPos: null,
			touchStartTime: 0,
			longPressTimer: null,
			touchThreshold: 10,
			longPressDuration: 500,
			currentTouch: null
		}
	})

	function handlePointerDown(e: PointerEvent, item: T, source: Position, type: K) {
		if (e.pointerType === 'touch') {
			initiateTouchDrag(e, item, source, type)
		} else {
			// For mouse, don't start drag immediately - wait for actual drag movement
			// This prevents the dragging class from being applied on simple clicks
			state.touchState.touchStartPos = { x: e.clientX, y: e.clientY }
			state.touchState.currentTouch = { item, source, type }
		}
	}

	function initiateTouchDrag(e: PointerEvent, item: T, source: Position, type: K) {
		state.touchState.touchStartPos = { x: e.clientX, y: e.clientY }
		state.touchState.touchStartTime = Date.now()

		const at = { x: e.clientX, y: e.clientY }
		state.touchState.longPressTimer = window.setTimeout(() => {
			startDrag(item, { ...source, type }, { touchAt: at })
			if ('vibrate' in navigator) {
				navigator.vibrate(50)
			}
		}, state.touchState.longPressDuration)
	}

	function handlePointerMove(e: PointerEvent) {
		if (!state.touchState.touchStartPos) return

		const distance = Math.sqrt(
			Math.pow(e.clientX - state.touchState.touchStartPos.x, 2) +
				Math.pow(e.clientY - state.touchState.touchStartPos.y, 2)
		)

		// For touch events, cancel long press if moved too much
		if (
			e.pointerType === 'touch' &&
			distance > state.touchState.touchThreshold &&
			state.touchState.longPressTimer
		) {
			clearTimeout(state.touchState.longPressTimer)
			state.touchState.longPressTimer = null
		}

		// For mouse events, start dragging after threshold movement
		if (e.pointerType === 'mouse' && !state.isDragging && state.touchState.currentTouch) {
			if (distance > state.touchState.touchThreshold) {
				const { item, source, type } = state.touchState.currentTouch
				setDuplicating(e.altKey)
				startDrag(item, { ...source, type })
				state.touchState.currentTouch = null
			}
		}
	}

	function handlePointerUp() {
		if (state.touchState.longPressTimer) {
			clearTimeout(state.touchState.longPressTimer)
			state.touchState.longPressTimer = null
		}
		state.touchState.touchStartPos = null
		state.touchState.currentTouch = null
	}

	/** Alt-drag duplicates only where the caller allows it */
	function setDuplicating(value: boolean) {
		state.isDuplicating = value && !!handlers.allowDuplicate
	}

	function handleAltKeyDown(e: KeyboardEvent) {
		if (e.key === 'Alt' && state.isDragging && handlers.allowDuplicate) {
			state.isDuplicating = true
			// Re-validate current hover target
			if (state.hoveredOver && state.draggedItem) {
				state.validDrop = validateDrop(state.draggedItem.source, state.hoveredOver)
			}
		}
	}

	function handleAltKeyUp(e: KeyboardEvent) {
		if (e.key === 'Alt' && state.isDragging) {
			state.isDuplicating = false
			// Re-validate current hover target
			if (state.hoveredOver && state.draggedItem) {
				state.validDrop = validateDrop(state.draggedItem.source, state.hoveredOver)
			}
		}
	}

	/**
	 * Start a drag. Mouse drags show the browser's own drag image; touch
	 * drags have none, so they get a label that follows the finger, starting
	 * where it pressed (`touchAt`).
	 */
	function startDrag(
		item: T,
		source: DragSource<K>,
		options?: { altKey?: boolean; touchAt?: { x: number; y: number } }
	) {
		try {
			if (import.meta.env.DEV) console.group('🚀 Drag Start')
			if (import.meta.env.DEV) console.log('Item:', item)
			if (import.meta.env.DEV) console.log('Source:', source)
			if (import.meta.env.DEV) console.groupEnd()

			state.isDragging = true
			if (options?.altKey) setDuplicating(true)
			state.draggedItem = {
				type: source.type,
				data: item,
				source
			}
			if (options?.touchAt) createDragPreview(item, options.touchAt)

			// Listen for Alt key toggles during drag
			if (handlers.allowDuplicate) {
				window.addEventListener('keydown', handleAltKeyDown)
				window.addEventListener('keyup', handleAltKeyUp)
			}
		} catch (error) {
			handleDragError(error as Error)
		}
	}

	function createDragPreview(item: T, at: { x: number; y: number }) {
		const preview = document.createElement('div')
		preview.className = 'drag-preview'
		// Styled like the app's menus, from the theme's variables
		preview.style.cssText = [
			'position: fixed',
			'pointer-events: none',
			'z-index: 10000',
			'padding: 6px 10px',
			'background: var(--menu-bg, var(--card-bg))',
			'color: var(--text-primary)',
			'border: 1px solid var(--border-subtle)',
			'border-radius: 8px',
			'box-shadow: var(--shadow-md)',
			'font-family: var(--font-family)',
			'font-size: 14px',
			'white-space: nowrap'
		].join('; ')
		// Built with DOM nodes so catalogue names are never parsed as HTML.
		preview.textContent = handlers.itemLabel?.(item) || 'Item'
		document.body.appendChild(preview)
		state.dragPreview = preview
		updateDragPreviewPosition(at.x, at.y)
	}

	function updateHover(target: DropTarget<K> | null) {
		state.hoveredOver = target

		if (target && state.draggedItem) {
			const isValid = validateDrop(state.draggedItem.source, target)
			state.validDrop = isValid
		} else {
			state.validDrop = false
		}
	}

	function determineOperationType(
		source: Position,
		target: Position,
		targetHasItem: boolean
	): 'move' | 'swap' | 'reorder' | 'duplicate' {
		if (state.isDuplicating && !targetHasItem) return 'duplicate'
		if (source.position === target.position && source.container === target.container)
			return 'reorder'
		if (targetHasItem) return 'swap'
		return 'move'
	}

	function endDrag(targetItem?: T) {
		try {
			if (import.meta.env.DEV) console.group('🏁 Drag End')
			if (import.meta.env.DEV) console.log('Final state:', { ...state })

			if (state.validDrop && state.draggedItem && state.hoveredOver) {
				const opType = determineOperationType(
					state.draggedItem.source,
					state.hoveredOver,
					!!targetItem
				)
				const operation: DragOperation<K> = {
					id: uuid(),
					type: opType,
					timestamp: Date.now(),
					source: {
						container: state.draggedItem.source.container,
						position: state.draggedItem.source.position,
						itemId: state.draggedItem.data.id,
						type: state.draggedItem.source.type,
						collectionLinked:
							opType === 'duplicate'
								? handlers.isCollectionLinked?.(state.draggedItem.data)
								: undefined
					},
					target: {
						container: state.hoveredOver.container,
						position: state.hoveredOver.position,
						itemId: targetItem?.id,
						type: state.hoveredOver.type
					}
				}

				handlers.onLocalUpdate?.(operation)
			}

			if (import.meta.env.DEV) console.groupEnd()
		} catch (error) {
			handleDragError(error as Error)
		} finally {
			cleanupDragState()
		}
	}

	function handleDragError(error: Error) {
		if (import.meta.env.DEV) console.error('🔥 Drag operation failed:', error)
		state.lastError = error
		cleanupDragState()
	}

	function cleanupDragState() {
		state.isDragging = false
		state.isDuplicating = false
		state.draggedItem = null
		state.hoveredOver = null
		state.validDrop = false

		if (state.dragPreview) {
			state.dragPreview.remove()
			state.dragPreview = null
		}

		if (state.touchState.longPressTimer) {
			clearTimeout(state.touchState.longPressTimer)
		}
		state.touchState = {
			...state.touchState,
			touchStartPos: null,
			longPressTimer: null,
			currentTouch: null
		}

		// Remove Alt key listeners
		window.removeEventListener('keydown', handleAltKeyDown)
		window.removeEventListener('keyup', handleAltKeyUp)
	}

	function validateDrop(source: DragSource<K>, target: DropTarget<K>): boolean {
		if (import.meta.env.DEV) console.group('🎯 Drop Validation')
		if (import.meta.env.DEV) console.log('Source:', source)
		if (import.meta.env.DEV) console.log('Target:', target)

		// Can't drop on self
		if (source.container === target.container && source.position === target.position) {
			if (import.meta.env.DEV) console.log('❌ Cannot drop on self')
			if (import.meta.env.DEV) console.groupEnd()
			return false
		}

		// Type mismatch check
		if (source.type !== target.type) {
			if (import.meta.env.DEV) console.log('❌ Type mismatch:', source.type, 'vs', target.type)
			if (import.meta.env.DEV) console.groupEnd()
			return false
		}

		// Custom validation
		if (handlers.onValidate) {
			const customValid = handlers.onValidate(source, target)
			if (import.meta.env.DEV)
				console.log(customValid ? '✅ Custom validation passed' : '❌ Custom validation failed')
			if (import.meta.env.DEV) console.groupEnd()
			return customValid
		}

		if (import.meta.env.DEV) console.log('✅ Drop allowed')
		if (import.meta.env.DEV) console.groupEnd()
		return true
	}

	function handleDrop(target: DropTarget<K>, targetItem?: T) {
		if (!state.draggedItem || !state.validDrop) {
			if (import.meta.env.DEV) console.log('❌ Invalid drop attempt')
			return false
		}

		const source = state.draggedItem.source
		const item = state.draggedItem.data

		if (import.meta.env.DEV) console.group('💧 Handle Drop')
		if (import.meta.env.DEV) console.log('From:', source)
		if (import.meta.env.DEV) console.log('To:', target)
		if (import.meta.env.DEV) console.log('Item:', item)
		if (import.meta.env.DEV) console.log('Target Item:', targetItem)

		if (targetItem) {
			// Swap items
			if (import.meta.env.DEV) console.log('🔄 Swapping items')
			handlers.onSwap?.(source, target, item, targetItem)
		} else {
			// Move to empty slot
			if (import.meta.env.DEV) console.log('📦 Moving to empty slot')
			handlers.onDrop?.(source, target, item)
		}

		if (import.meta.env.DEV) console.groupEnd()
		endDrag(targetItem)
		return true
	}

	function updateDragPreviewPosition(x: number, y: number) {
		if (state.dragPreview) {
			state.dragPreview.style.left = `${x + 10}px`
			state.dragPreview.style.top = `${y - 20}px`
		}
	}

	return {
		get state() {
			return state
		},
		startDrag,
		setDuplicating,
		updateHover,
		endDrag,
		validateDrop,
		handleDrop,
		handlePointerDown,
		handlePointerMove,
		handlePointerUp,
		updateDragPreviewPosition
	}
}

export type DragDropContext<
	T extends DragItem = GridItem,
	K extends string = GridItemType
> = ReturnType<typeof createDragDropContext<T, K>>

// ============================================================================
// Context API for child components
// ============================================================================

import { getContext, setContext } from 'svelte'

const DRAG_DROP_KEY = Symbol('drag-drop')

export function setDragDropContext<T extends DragItem, K extends string>(
	value: DragDropContext<T, K>
) {
	setContext(DRAG_DROP_KEY, value)
}

/**
 * The context the nearest drag-and-drop owner set. DraggableItem and
 * DropZone only pass items and types through, so they read it untyped.
 */
export function getDragDropContext(): DragDropContext<DragItem, string> | undefined {
	return getContext<DragDropContext<DragItem, string> | undefined>(DRAG_DROP_KEY)
}
