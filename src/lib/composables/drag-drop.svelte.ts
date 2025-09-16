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
	}
	target: {
		container: string
		position: number
		itemId?: string
	}
	status: 'pending' | 'synced' | 'failed'
	retryCount: number
}

export interface TouchState {
	touchStartPos: { x: number; y: number } | null
	touchStartTime: number
	longPressTimer: number | null
	touchThreshold: number
	longPressDuration: number
	currentTouch: Touch | null
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
			startDrag(item, { ...source, type })
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

		if (distance > state.touchState.touchThreshold && state.touchState.longPressTimer) {
			clearTimeout(state.touchState.longPressTimer)
			state.touchState.longPressTimer = null
		}
	}

	function handlePointerUp() {
		if (state.touchState.longPressTimer) {
			clearTimeout(state.touchState.longPressTimer)
			state.touchState.longPressTimer = null
		}
		state.touchState.touchStartPos = null
	}

	function startDrag(item: GridItem, source: DragSource) {
		try {
			console.group('🚀 Drag Start')
			console.log('Item:', item)
			console.log('Source:', source)
			console.groupEnd()

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

	function endDrag(targetHasItem: boolean = false) {
		try {
			console.group('🏁 Drag End')
			console.log('Final state:', { ...state })

			if (state.validDrop && state.draggedItem && state.hoveredOver) {
				const operation: DragOperation = {
					id: crypto.randomUUID(),
					type: determineOperationType(state.draggedItem.source, state.hoveredOver, targetHasItem),
					timestamp: Date.now(),
					source: {
						container: state.draggedItem.source.container,
						position: state.draggedItem.source.position,
						itemId: state.draggedItem.data.id
					},
					target: {
						container: state.hoveredOver.container,
						position: state.hoveredOver.position,
						itemId: targetHasItem ? 'has-item' : undefined
					},
					status: 'pending',
					retryCount: 0
				}

				state.operationQueue.push(operation)
				console.log('📝 Operation queued:', operation)

				handlers.onLocalUpdate?.(operation)
			}

			console.groupEnd()
		} catch (error) {
			handleDragError(error as Error)
		} finally {
			cleanupDragState()
		}
	}

	function handleDragError(error: Error) {
		console.error('🔥 Drag operation failed:', error)
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
		console.group('🎯 Drop Validation')
		console.log('Source:', source)
		console.log('Target:', target)

		// Can't drop on self
		if (source.container === target.container && source.position === target.position) {
			console.log('❌ Cannot drop on self')
			console.groupEnd()
			return false
		}

		// Type mismatch check
		if (source.type !== target.type) {
			console.log('❌ Type mismatch:', source.type, 'vs', target.type)
			console.groupEnd()
			return false
		}

		// Custom validation
		if (handlers.onValidate) {
			const customValid = handlers.onValidate(source, target)
			console.log(customValid ? '✅ Custom validation passed' : '❌ Custom validation failed')
			console.groupEnd()
			return customValid
		}

		console.log('✅ Drop allowed')
		console.groupEnd()
		return true
	}

	function handleDrop(target: DropTarget, targetItem?: GridItem) {
		if (!state.draggedItem || !state.validDrop) {
			console.log('❌ Invalid drop attempt')
			return false
		}

		const source = state.draggedItem.source
		const item = state.draggedItem.data

		console.group('💧 Handle Drop')
		console.log('From:', source)
		console.log('To:', target)
		console.log('Item:', item)
		console.log('Target Item:', targetItem)

		if (targetItem) {
			// Swap items
			console.log('🔄 Swapping items')
			handlers.onSwap?.(source, target, item, targetItem)
		} else {
			// Move to empty slot
			console.log('📦 Moving to empty slot')
			handlers.onDrop?.(source, target, item)
		}

		console.groupEnd()
		endDrag(!!targetItem)
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