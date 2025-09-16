<svelte:options runes={true} />

<script lang="ts">
	import { getContext } from 'svelte'
	import type { GridItem, GridItemType, DragDropContext } from '$lib/composables/drag-drop.svelte'

	interface Props {
		container: string
		position: number
		type: GridItemType
		item?: GridItem
		canDrop?: boolean
		onDrop?: (item: GridItem) => void
		children?: any
	}

	let {
		container,
		position,
		type,
		item,
		canDrop = true,
		onDrop,
		children
	}: Props = $props()

	const dragContext = getContext<DragDropContext>('drag-drop')
	let elementRef: HTMLElement | undefined = $state()

	let isHovered = $derived(
		dragContext?.state.hoveredOver?.container === container &&
		dragContext?.state.hoveredOver?.position === position
	)

	let isValidDrop = $derived(
		isHovered && dragContext?.state.validDrop
	)

	let isInvalidDrop = $derived(
		isHovered && !dragContext?.state.validDrop
	)

	function handleDragOver(e: DragEvent) {
		if (!canDrop || !dragContext) return

		e.preventDefault()
		e.dataTransfer!.dropEffect = 'move'

		if (dragContext.state.draggedItem) {
			const target = { container, position, type }
			dragContext.updateHover(target)

			const isValid = dragContext.validateDrop(
				dragContext.state.draggedItem.source,
				target
			)

			if (!isValid) {
				e.dataTransfer!.dropEffect = 'none'
			}
		}
	}

	function handleDragEnter(e: DragEvent) {
		if (!canDrop || !dragContext) return
		e.preventDefault()

		const target = { container, position, type }
		dragContext.updateHover(target)
	}

	function handleDragLeave(e: DragEvent) {
		if (!dragContext) return

		if (e.relatedTarget && elementRef?.contains(e.relatedTarget as Node)) {
			return
		}

		dragContext.updateHover(null)
	}

	function handleDrop(e: DragEvent) {
		if (!canDrop || !dragContext) return

		e.preventDefault()
		e.stopPropagation()

		const target = { container, position, type }

		if (dragContext.state.draggedItem && dragContext.state.validDrop) {
			const success = dragContext.handleDrop(target, item)

			if (success && onDrop && dragContext.state.draggedItem) {
				onDrop(dragContext.state.draggedItem.data)
			}
		}

		dragContext.updateHover(null)
	}
</script>

<div
	bind:this={elementRef}
	ondragover={handleDragOver}
	ondragenter={handleDragEnter}
	ondragleave={handleDragLeave}
	ondrop={handleDrop}
	class="drop-zone"
	class:hovered={isHovered}
	class:valid-drop={isValidDrop}
	class:invalid-drop={isInvalidDrop}
	class:can-drop={canDrop}
	data-container={container}
	data-position={position}
	data-type={type}
>
	{@render children?.()}
</div>

<style lang="scss">
	.drop-zone {
		position: relative;
		transition: all 0.2s ease-out;

		&.hovered {
			transform: scale(1.02);
		}

		&.valid-drop {
			border: 2px dashed #4CAF50;
			background: rgba(76, 175, 80, 0.1);
			border-radius: 8px;

			&::before {
				content: '';
				position: absolute;
				inset: -4px;
				border: 2px solid #4CAF50;
				border-radius: 10px;
				opacity: 0.3;
				pointer-events: none;
				animation: pulse 1s ease-in-out infinite;
			}
		}

		&.invalid-drop {
			border: 2px dashed #F44336;
			background: rgba(244, 67, 54, 0.1);
			border-radius: 8px;
			opacity: 0.7;

			&::after {
				content: '⚠';
				position: absolute;
				top: 50%;
				left: 50%;
				transform: translate(-50%, -50%);
				font-size: 24px;
				color: #F44336;
				pointer-events: none;
			}
		}
	}

	@keyframes pulse {
		0% {
			opacity: 0.3;
			transform: scale(1);
		}
		50% {
			opacity: 0.5;
			transform: scale(1.02);
		}
		100% {
			opacity: 0.3;
			transform: scale(1);
		}
	}
</style>