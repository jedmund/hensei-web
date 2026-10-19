/**
 * What a team page's sticker picker and sticker area share: the sticker
 * being dragged out of the picker, the area it can be dropped in, and the
 * area asking the picker to open by a point in it. One per team page (set
 * by Party), so it's never shared between pages or server requests.
 */
import { getContext, setContext } from 'svelte'
import { useStickerActions, type StickerActions } from '$lib/composables/sticker-actions.svelte'
import type { Sticker } from '$lib/types/api/sticker'
import type { Party, StickerPlacement } from '$lib/types/api/party'
import {
	GHOST_SCALE,
	GHOST_SCALE_OVER_ZONE,
	trackDrag,
	type DropZone,
	type StickerDrop
} from './stickerDrag.svelte'

/** Something the picker's menu can be positioned against */
export interface PickerAnchor {
	getBoundingClientRect(): DOMRect
}

interface DragState {
	sticker: Sticker | null
	x: number
	y: number
	tilt: number
	/** Over the drop zone, so the ghost can show it will land */
	overZone: boolean
}

interface PickerRequest {
	/** Asked for, and not yet opened */
	pending: boolean
	anchor: PickerAnchor | null
	/** Where the picked sticker goes; null to swap the viewer's in place */
	placement: StickerPlacement | null
}

export class StickerStage {
	/** The sticker being dragged out of the picker */
	drag = $state<DragState>({ sticker: null, x: 0, y: 0, tilt: 0, overZone: false })
	/** The sticker area asking the picker to open by a point in it. Raw, so
	 * the anchor stays the object the area made (it compares it) */
	request = $state.raw<PickerRequest>({ pending: false, anchor: null, placement: null })
	#zone: DropZone | null = null

	/** Giving, moving and taking back the viewer's sticker: one instance for
	 * the page, so one save at a time between the picker and the area */
	readonly actions: StickerActions | null

	constructor(actions: StickerActions | null) {
		this.actions = actions
	}

	/** The sticker area accepts drops while registered */
	registerDropZone(zone: DropZone): () => void {
		this.#zone = zone
		return () => {
			if (this.#zone === zone) this.#zone = null
		}
	}

	/** Places a sticker in the drop zone as if dropped there, then gives it
	 * with `give`; if that fails, the placement is taken back */
	dropInZone(
		slug: string,
		placement: StickerPlacement,
		drop: StickerDrop,
		give: (slug: string, placement: StickerPlacement) => Promise<boolean>
	): Promise<boolean> {
		const undo = this.#zone?.place(slug, placement, drop)
		return give(slug, placement).then((given) => {
			if (!given) undo?.()
			return given
		})
	}

	/** Clicking an empty spot (with `placement`, where the picked sticker
	 * goes) or your own sticker (without, to swap it in place) */
	requestPicker(anchor: PickerAnchor, placement: StickerPlacement | null) {
		this.request = { pending: true, anchor, placement }
	}

	/** The picker opened for the request */
	takePickerRequest() {
		this.request = { ...this.request, pending: false }
	}

	clearPickerRequest() {
		this.request = { pending: false, anchor: null, placement: null }
	}

	/**
	 * Follows a press on `sticker` in the picker. Becomes a drag once the
	 * pointer moves past the threshold (calling `onDragStart`, e.g. to close
	 * the menu); a press that never moves stays a click. On release over the
	 * drop zone the sticker is placed right away, landing from where the
	 * ghost was, and `onDrop` gives it.
	 */
	pressSticker(
		event: PointerEvent,
		sticker: Sticker,
		handlers: {
			onDragStart: () => void
			onDrop: (slug: string, placement: StickerPlacement) => Promise<boolean>
		}
	) {
		const drag = this.drag
		const zoneAt = (x: number, y: number) => this.#zone?.placementAt(x, y) ?? null
		const reset = () => {
			drag.sticker = null
			drag.overZone = false
			drag.tilt = 0
		}

		trackDrag(event, {
			start() {
				drag.sticker = sticker
				handlers.onDragStart()
			},
			move(e) {
				drag.x = e.clientX
				drag.y = e.clientY
				drag.overZone = zoneAt(e.clientX, e.clientY) != null
			},
			frame(tilt) {
				drag.tilt = tilt
			},
			drop: (e, tilt) => {
				const overZone = drag.overZone
				reset()
				const placement = zoneAt(e.clientX, e.clientY)
				if (!placement) return
				const placed = { ...placement, rotation: tilt }
				void this.dropInZone(
					sticker.slug,
					placed,
					{
						clientX: e.clientX,
						clientY: e.clientY,
						tilt,
						scale: overZone ? GHOST_SCALE_OVER_ZONE : GHOST_SCALE
					},
					handlers.onDrop
				)
			},
			cancel: reset
		})
	}
}

const KEY = Symbol('stickerStage')

/** Sets up the stage for a team page; call while the component sets up */
export function setStickerStage(getParty: () => Pick<Party, 'id' | 'shortcode'>): StickerStage {
	return setContext(KEY, new StickerStage(useStickerActions({ getParty })))
}

/** The team page's stage; a picker or area on its own gets one to itself
 * (without shared actions) */
export function useStickerStage(): StickerStage {
	return getContext<StickerStage | undefined>(KEY) ?? new StickerStage(null)
}
