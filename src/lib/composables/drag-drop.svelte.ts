import type { GridCharacter, GridWeapon, GridSummon } from '$lib/types/api/party'

export type GridItemType = 'character' | 'weapon' | 'summon'
export type GridItem = GridCharacter | GridWeapon | GridSummon

export interface Position {
	container: string
	position: number
}

export interface DragSource extends Position {
	type: GridItemType
}

export interface DraggedItem {
	type: GridItemType
	data: GridItem
	source: DragSource
}

export interface DropTarget extends Position {
	type: GridItemType
}

export interface DragOperation {
	id: string
	type: 'move' | 'swap' | 'reorder'
	timestamp: number
	source: {
		container: string
		position: number
		itemId: string
		type?: GridItemType | undefined
	}
	target: {
		container: string
		position: number
		itemId?: string | undefined
		type?: GridItemType | undefined
	}
	status: 'pending' | 'synced' | 'failed'
	retryCount: number
}

export interface PendingDragData {
	item: GridItem
	source: Position
	type: GridItemType
}

export interface TouchState {
	touchStartPos: { x: number; y: number } | null
	touchStartTime: number
	longPressTimer: number | null
	touchThreshold: number
	longPressDuration: number
	currentTouch: PendingDragData | null
}

export interface DragDropState {
	isDragging: boolean
	draggedItem: DraggedItem | null
	hoveredOver: DropTarget | null
	validDrop: boolean
	dragPreview: HTMLElement | null
	operationQueue: DragOperation[]
	lastError: Error | null
	touchState: TouchState
}

export interface DragDropHandlers {
	onDrop?: (from: DragSource, to: DropTarget, item: GridItem) => void
	onSwap?: (from: DragSource, to: DropTarget, fromItem: GridItem, toItem: GridItem) => void
	onValidate?: (from: DragSource, to: DropTarget) => boolean
	onLocalUpdate?: (operation: DragOperation) => void
}

export function createDragDropContext(handlers: DragDropHandlers = {}) {
	let state = $state<DragDropState>({
		isDragging: false,
		draggedItem: null,
		hoveredOver: null,
		validDrop: false,
		dragPreview: null,
		operationQueue: [],
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

	function detectItemType(item: GridItem): GridItemType {
		if ('character' in item) return 'character'
		if ('weapon' in item) return 'weapon'
		if ('summon' in item) return 'summon'
		throw new Error('Unknown item type')
	}

	function handlePointerDown(e: PointerEvent, item: GridItem, source: Position, type: GridItemType) {
		if (e.pointerType === 'touch') {
			initiateTouchDrag(e, item, source, type)
		} else {
			// For mouse, don't start drag immediately - wait for actual drag movement
			// This prevents the dragging class from being applied on simple clicks
			state.touchState.touchStartPos = { x: e.clientX, y: e.clientY }
			state.touchState.currentTouch = { item, source, type }
		}
	}

	function initiateTouchDrag(e: PointerEvent, item: GridItem, source: Position, type: GridItemType) {
		state.touchState.touchStartPos = { x: e.clientX, y: e.clientY }
		state.touchState.touchStartTime = Date.now()

		state.touchState.longPressTimer = window.setTimeout(() => {
			startDrag(item, { ...source, type })
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
		if (e.pointerType === 'touch' && distance > state.touchState.touchThreshold && state.touchState.longPressTimer) {
			clearTimeout(state.touchState.longPressTimer)
			state.touchState.longPressTimer = null
		}

		// For mouse events, start dragging after threshold movement
		if (e.pointerType === 'mouse' && !state.isDragging && state.touchState.currentTouch) {
			if (distance > state.touchState.touchThreshold) {
				const { item, source, type } = state.touchState.currentTouch
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

	function startDrag(item: GridItem, source: DragSource) {
		try {
			if (import.meta.env.DEV) console.group('🚀 Drag Start')
			if (import.meta.env.DEV) console.log('Item:', item)
			if (import.meta.env.DEV) console.log('Source:', source)
			if (import.meta.env.DEV) console.groupEnd()

			state.isDragging = true
			state.draggedItem = {
				type: source.type,
				data: item,
				source
			}
			createDragPreview(item)
		} catch (error) {
			handleDragError(error as Error)
		}
	}

	function createDragPreview(item: GridItem) {
		const preview = document.createElement('div')
		preview.className = 'drag-preview'
		preview.style.position = 'fixed'
		preview.style.pointerEvents = 'none'
		preview.style.zIndex = '10000'
		preview.style.opacity = '0.8'

		const itemName = 'character' in item ? item.character.name :
						 'weapon' in item ? item.weapon.name :
						 'summon' in item ? item.summon.name : 'Unknown'

		preview.innerHTML = `
			<div class="drag-preview-content" style="padding: 8px; background: white; border: 2px solid #ccc; border-radius: 4px;">
				<span>${itemName || 'Item'}</span>
			</div>
		`
		document.body.appendChild(preview)
		state.dragPreview = preview
	}

	function updateHover(target: DropTarget | null) {
		state.hoveredOver = target

		if (target && state.draggedItem) {
			const isValid = validateDrop(state.draggedItem.source, target)
			state.validDrop = isValid
		} else {
			state.validDrop = false
		}
	}

	function determineOperationType(source: Position, target: Position, targetHasItem: boolean): 'move' | 'swap' | 'reorder' {
		if (source.position === target.position && source.container === target.container) return 'reorder'
		if (targetHasItem) return 'swap'
		return 'move'
	}

	function endDrag(targetItem?: GridItem) {
		try {
			if (import.meta.env.DEV) console.group('🏁 Drag End')
			if (import.meta.env.DEV) console.log('Final state:', { ...state })

			if (state.validDrop && state.draggedItem && state.hoveredOver) {
				const operation: DragOperation = {
					id: crypto.randomUUID(),
					type: determineOperationType(state.draggedItem.source, state.hoveredOver, !!targetItem),
					timestamp: Date.now(),
					source: {
						container: state.draggedItem.source.container,
						position: state.draggedItem.source.position,
						itemId: state.draggedItem.data.id,
						type: state.draggedItem.source.type
					},
					target: {
						container: state.hoveredOver.container,
						position: state.hoveredOver.position,
						itemId: targetItem?.id,
						type: state.hoveredOver.type
					},
					status: 'pending',
					retryCount: 0
				}

				state.operationQueue.push(operation)
				if (import.meta.env.DEV) console.log('📝 Operation queued:', operation)

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
	}

	function validateDrop(source: DragSource, target: DropTarget): boolean {
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
			if (import.meta.env.DEV) console.log(customValid ? '✅ Custom validation passed' : '❌ Custom validation failed')
			if (import.meta.env.DEV) console.groupEnd()
			return customValid
		}

		if (import.meta.env.DEV) console.log('✅ Drop allowed')
		if (import.meta.env.DEV) console.groupEnd()
		return true
	}

	function handleDrop(target: DropTarget, targetItem?: GridItem) {
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

	function getQueuedOperations() {
		return state.operationQueue.filter(op => op.status === 'pending')
	}

	function clearQueue() {
		state.operationQueue = []
	}

	return {
		get state() {
			return state
		},
		startDrag,
		updateHover,
		endDrag,
		validateDrop,
		handleDrop,
		handlePointerDown,
		handlePointerMove,
		handlePointerUp,
		updateDragPreviewPosition,
		getQueuedOperations,
		clearQueue
	}
}

export type DragDropContext = ReturnType<typeof createDragDropContext>

// ============================================================================
// Context API for child components
// ============================================================================

import { getContext, setContext } from 'svelte'

const DRAG_DROP_KEY = Symbol('drag-drop')

export function setDragDropContext(value: DragDropContext) {
	setContext(DRAG_DROP_KEY, value)
}

export function getDragDropContext(): DragDropContext | undefined {
	return getContext<DragDropContext | undefined>(DRAG_DROP_KEY)
}