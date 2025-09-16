<svelte:options runes={true} />

<script lang="ts">
	import { getContext, onMount } from 'svelte'
	import type { GridItem, GridItemType, DragDropContext } from '$lib/composables/drag-drop.svelte'

	interface Props {
		item: GridItem | undefined
		container: string
		position: number
		type: GridItemType
		canDrag?: boolean
		customPreview?: boolean
		children?: any
	}

	let {
		item,
		container,
		position,
		type,
		canDrag = true,
		customPreview = false,
		children
	}: Props = $props()

	const dragContext = getContext<DragDropContext>('drag-drop')
	let elementRef: HTMLElement | undefined = $state()
	let isDragging = $derived(
		dragContext?.state.isDragging &&
		dragContext?.state.draggedItem?.source.container === container &&
		dragContext?.state.draggedItem?.source.position === position
	)

	function handleDragStart(e: DragEvent) {
		if (!canDrag || !item || !dragContext) {
			e.preventDefault()
			return
		}

		e.dataTransfer!.effectAllowed = 'move'
		e.dataTransfer!.setData('application/json', JSON.stringify({
			item,
			container,
			position,
			type
		}))

		if (customPreview && elementRef) {
			const ghost = createCustomGhost()
			e.dataTransfer!.setDragImage(ghost, e.offsetX, e.offsetY)
			requestAnimationFrame(() => ghost.remove())
		}

		dragContext.startDrag(item, { container, position, type })
	}

	function handleDragEnd(e: DragEvent) {
		if (!dragContext) return
		dragContext.endDrag()
	}

	function createCustomGhost(): HTMLElement {
		if (!elementRef) throw new Error('Element ref not available')

		const ghost = document.createElement('div')
		ghost.className = 'drag-ghost'
		ghost.style.position = 'absolute'
		ghost.style.top = '-1000px'
		ghost.style.left = '-1000px'
		ghost.style.transform = 'rotate(5deg) scale(1.05)'
		ghost.style.opacity = '0.8'

		ghost.innerHTML = elementRef.innerHTML
		document.body.appendChild(ghost)

		return ghost
	}

	function handlePointerDown(e: PointerEvent) {
		if (!canDrag || !item || !dragContext) return
		dragContext.handlePointerDown(e, item, { container, position }, type)
	}

	function handlePointerMove(e: PointerEvent) {
		if (!dragContext) return
		dragContext.handlePointerMove(e)

		if (dragContext.state.isDragging && e.pointerType === 'touch') {
			e.preventDefault()
			dragContext.updateDragPreviewPosition(e.clientX, e.clientY)
		}
	}

	function handlePointerUp(e: PointerEvent) {
		if (!dragContext) return
		dragContext.handlePointerUp()
	}

	function handleTouchStart(e: TouchEvent) {
		if (!canDrag || !item) return
		e.preventDefault()
	}

	function handleTouchMove(e: TouchEvent) {
		if (!dragContext || !dragContext.state.isDragging) return
		e.preventDefault()
		const touch = e.touches[0]
		if (touch) {
			dragContext.updateDragPreviewPosition(touch.clientX, touch.clientY)
		}
	}

	function handleTouchEnd(e: TouchEvent) {
		if (!dragContext || !dragContext.state.isDragging) return

		const touch = e.changedTouches[0]
		if (touch) {
			const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY)
			if (dropTarget) {
				const event = new CustomEvent('drop', {
					detail: { clientX: touch.clientX, clientY: touch.clientY }
				})
				dropTarget.dispatchEvent(event)
			}
		}

		dragContext.endDrag()
	}

	onMount(() => {
		if (!elementRef || !('ontouchstart' in window)) return

		elementRef.addEventListener('touchstart', handleTouchStart, { passive: false })
		elementRef.addEventListener('touchmove', handleTouchMove, { passive: false })
		elementRef.addEventListener('touchend', handleTouchEnd)

		return () => {
			if (elementRef) {
				elementRef.removeEventListener('touchstart', handleTouchStart)
				elementRef.removeEventListener('touchmove', handleTouchMove)
				elementRef.removeEventListener('touchend', handleTouchEnd)
			}
		}
	})
</script>

<div
	bind:this={elementRef}
	draggable={canDrag && !!item}
	ondragstart={handleDragStart}
	ondragend={handleDragEnd}
	onpointerdown={handlePointerDown}
	onpointermove={handlePointerMove}
	onpointerup={handlePointerUp}
	class="draggable-item"
	class:dragging={isDragging}
	class:can-drag={canDrag && !!item}
	class:empty={!item}
	data-container={container}
	data-position={position}
	data-type={type}
>
	{@render children?.()}
</div>

<style lang="scss">
	.draggable-item {
		position: relative;
		transition: opacity 0.2s, transform 0.2s;

		&.dragging {
			opacity: 0.5;
			cursor: grabbing;
		}

		&.can-drag {
			cursor: grab;
			touch-action: none;
			user-select: none;

			&:hover {
				transform: scale(1.02);
			}

			&:active {
				cursor: grabbing;
			}
		}

		&.empty {
			cursor: default;
		}
	}

	:global(.drag-ghost) {
		filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
	}
</style>