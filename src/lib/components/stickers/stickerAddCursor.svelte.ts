/**
 * Clicking an empty spot in the sticker area to give a sticker there,
 * before the viewer has given one: a (+) follows the mouse, stays where it
 * was clicked while the picker is open, and the sticker picked lands on it.
 * The component wires the area's pointer events to hover, leave, press and
 * click, and draws StickerAddMarker at `at`.
 */
import { ADD_MARKER_SIZE } from './StickerAddMarker.svelte'
import type { StickerAreaState } from './stickerAreaState.svelte'
import type { PickerAnchor, StickerStage } from './stickerStage.svelte'
import type { Point } from '$lib/utils/stickerLayout'

/** Marks a placed sticker, which the (+) gives way to */
export const PLACED_STICKER_ATTR = 'data-placed-sticker'

function overSticker(event: Event): boolean {
	return (event.target as Element | null)?.closest(`[${PLACED_STICKER_ATTR}]`) != null
}

export class StickerAddCursor {
	/** Where the mouse last was over empty space; it stays put while the (+)
	 * fades out over a sticker or off the area */
	hoverAt = $state<Point | null>(null)
	hovering = $state(false)
	/** Pressed like a button while the mouse is down on empty space */
	pressed = $state(false)
	// Where it was clicked, while the picker it opened is open. Raw, so the
	// anchor stays the object the picker request holds.
	#pinned = $state.raw<{ anchor: PickerAnchor; at: Point } | null>(null)

	#area: StickerAreaState
	#stage: StickerStage
	#enabled: () => boolean

	constructor(area: StickerAreaState, stage: StickerStage, enabled: () => boolean) {
		this.#area = area
		this.#stage = stage
		this.#enabled = enabled
	}

	readonly #pinnedAt = $derived.by(() =>
		this.#pinned && this.#stage.request.anchor === this.#pinned.anchor ? this.#pinned.at : null
	)

	/** Where to draw the (+), or null for none */
	get at(): Point | null {
		return this.#enabled() ? (this.#pinnedAt ?? this.hoverAt) : null
	}

	/** Visible, rather than faded out */
	get shown(): boolean {
		return this.#pinnedAt !== null || this.hovering
	}

	hover = (event: PointerEvent) => {
		const at = this.#area.local(event.clientX, event.clientY)
		if (!at || event.pointerType !== 'mouse' || overSticker(event)) {
			this.hovering = false
			return
		}
		this.hoverAt = at
		this.hovering = true
	}

	leave = () => {
		this.hovering = false
	}

	press = (event: PointerEvent) => {
		if (!this.#enabled() || event.button !== 0 || overSticker(event)) return
		this.pressed = true
		window.addEventListener('pointerup', () => (this.pressed = false), { once: true })
	}

	click = (event: MouseEvent) => {
		const element = this.#area.element
		const at = this.#area.local(event.clientX, event.clientY)
		if (!this.#enabled() || !element || !at || overSticker(event)) return
		const placement = this.#area.placementAt(event.clientX, event.clientY)
		if (!placement) return
		// Measured live, so the menu stays by the spot if the page scrolls
		const anchor: PickerAnchor = {
			getBoundingClientRect: () => {
				const now = element.getBoundingClientRect()
				return DOMRect.fromRect({
					x: now.left + at.left - ADD_MARKER_SIZE / 2,
					y: now.top + at.top - ADD_MARKER_SIZE / 2,
					width: ADD_MARKER_SIZE,
					height: ADD_MARKER_SIZE
				})
			}
		}
		this.#pinned = { anchor, at }
		this.#stage.requestPicker(anchor, placement)
	}
}
