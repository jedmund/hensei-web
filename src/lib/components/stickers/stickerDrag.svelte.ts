/**
 * Dragging stickers: out of the picker into a team's sticker area, and
 * your own sticker within it. The pieces that hold no state; the state a
 * team page shares between its picker and sticker area is the sticker stage
 * (stickerStage.svelte.ts).
 */
import type { StickerPlacement } from '$lib/types/api/party'

/** How a dropped sticker looked as it was let go, so it can land from there */
export interface StickerDrop {
	clientX: number
	clientY: number
	/** The lean it had from the drag, in degrees */
	tilt: number
	scale: number
}

export interface DropZone {
	/** The placement for a sticker dropped at this point, or null when outside */
	placementAt(clientX: number, clientY: number): StickerPlacement | null
	/** Shows it placed right away; returns how to take that back if the
	 * give fails */
	place(slug: string, placement: StickerPlacement, drop: StickerDrop): () => void
}

// The ghost's scale while dragging, and over the drop zone
export const GHOST_SCALE = 1.15
export const GHOST_SCALE_OVER_ZONE = 1.05

/**
 * Leans a dragged sticker with its horizontal motion: dragging left tilts it
 * left, right tilts it right, and it straightens out when the pointer rests.
 */
export class DragTilt {
	angle = $state(0)
	#target = 0
	#lastX = 0
	#lastTime = 0
	#frame = 0

	start(x: number) {
		this.#lastX = x
		this.#lastTime = performance.now()
		this.#target = 0
		this.angle = 0
		const step = () => {
			// The push from recent motion fades, and the angle eases toward it
			this.#target *= 0.88
			this.angle += (this.#target - this.angle) * 0.25
			this.#frame = requestAnimationFrame(step)
		}
		this.#frame = requestAnimationFrame(step)
	}

	move(x: number) {
		const now = performance.now()
		const velocity = (x - this.#lastX) / Math.max(now - this.#lastTime, 1)
		this.#target = Math.min(Math.max(velocity * 20, -18), 18)
		this.#lastX = x
		this.#lastTime = now
	}

	stop() {
		cancelAnimationFrame(this.#frame)
	}
}

/** Pointer travel before a press becomes a drag; less is a click */
export const DRAG_THRESHOLD = 5

export interface DragHandlers {
	/** The press became a drag */
	start?(event: PointerEvent): void
	/** The pointer moved while dragging */
	move?(event: PointerEvent): void
	/** Every frame while dragging, with the eased lean (DragTilt) */
	frame?(tilt: number): void
	/** Let go after dragging, with the lean it had */
	drop?(event: PointerEvent, tilt: number): void
	/** Let go without dragging */
	click?(event: PointerEvent): void
	/** The drag was cancelled (the pointer was lost, e.g. to a touch gesture) */
	cancel?(): void
}

/**
 * Follows a press from `event` until it's let go or cancelled: a click if
 * it barely moves, otherwise a drag that leans with its motion. Listens on
 * the window, so the drag carries on outside the element pressed.
 */
export function trackDrag(event: PointerEvent, handlers: DragHandlers) {
	if (event.button !== 0) return
	const tilt = new DragTilt()
	let dragging = false
	let frame = 0

	function move(e: PointerEvent) {
		if (!dragging) {
			if (Math.hypot(e.clientX - event.clientX, e.clientY - event.clientY) < DRAG_THRESHOLD) return
			dragging = true
			tilt.start(e.clientX)
			frame = requestAnimationFrame(function sync() {
				handlers.frame?.(tilt.angle)
				frame = requestAnimationFrame(sync)
			})
			handlers.start?.(e)
		}
		e.preventDefault()
		tilt.move(e.clientX)
		handlers.move?.(e)
	}

	function up(e: PointerEvent) {
		const lean = tilt.angle
		stop()
		if (dragging) handlers.drop?.(e, lean)
		else handlers.click?.(e)
	}

	function cancel() {
		stop()
		if (dragging) handlers.cancel?.()
	}

	function stop() {
		tilt.stop()
		cancelAnimationFrame(frame)
		window.removeEventListener('pointermove', move)
		window.removeEventListener('pointerup', up)
		window.removeEventListener('pointercancel', cancel)
	}

	window.addEventListener('pointermove', move, { passive: false })
	window.addEventListener('pointerup', up)
	window.addEventListener('pointercancel', cancel)
}
