/**
 * The sticker area's state: how big it is, where every sticker sits, and
 * moving the viewer's own. The component binds the area's element and
 * width, and draws what this works out; the layout itself is plain
 * functions (utils/stickerLayout).
 */
import { findSticker } from '$lib/utils/stickers'
import {
	ROW_TOP,
	areaHeight,
	clampPoint,
	freeSpot,
	fromFraction,
	layoutStickers,
	stickerBounds,
	toFraction,
	withinBounds,
	type Insets,
	type LayoutItem,
	type Point
} from '$lib/utils/stickerLayout'
import { trackDrag } from './stickerDrag.svelte'
import type { PlacedSticker, StickerPlacement } from '$lib/types/api/party'
import type { Sticker } from '$lib/types/api/sticker'

/**
 * Placements are kept by the given sticker's id, except the viewer's own,
 * which is kept as OWN_KEY: it exists (optimistically) before the refetch
 * that would give it an id, and keeps its spot when swapped for another
 */
export const OWN_KEY = 'mine'

export interface ShownSticker {
	key: string
	slug: string
	own: boolean
	sticker: Sticker
}

interface Source {
	/** Every sticker given, one per giver */
	placed: PlacedSticker[] | undefined
	/** The viewer's sticker, ahead of `placed` while a give is in flight */
	mySticker: string | null | undefined
	size: number
	/** The sticker catalogue, once loaded */
	catalogue: Sticker[] | undefined
}

export class StickerAreaState {
	/** Bound by the component */
	element = $state<HTMLElement>()
	width = $state(0)
	/** How far the card's edges are outside the area (see measure) */
	insets = $state<Insets>({ left: 0, right: 0, bottom: 0 })
	/** The viewer's placement while it's being dropped or moved, ahead of
	 * the server's */
	ownPlacement = $state<StickerPlacement | null>(null)
	/** The viewer's sticker while it's being dragged within the area */
	moving = $state<string | null>(null)

	#source: () => Source

	constructor(source: () => Source) {
		this.#source = source
	}

	get size(): number {
		return this.#source().size
	}

	/** The area's size is known (only in the browser), so stickers can be
	 * drawn where they belong */
	get ready(): boolean {
		return this.width > 0
	}

	/** How many stickers there are, before the catalogue has loaded */
	readonly count = $derived.by(() => {
		const { placed, mySticker } = this.#source()
		return (placed ?? []).filter((given) => !given.mine).length + (mySticker ? 1 : 0)
	})

	// Lines up unplaced stickers; reads placements, declared below
	readonly height = $derived.by(() =>
		areaHeight(
			this.width,
			this.count,
			Math.max(0, this.count - Object.keys(this.placements).length),
			this.size
		)
	)

	readonly bounds = $derived(stickerBounds(this.width, this.height, this.insets, this.size))

	readonly placements = $derived.by(() => {
		const byKey: Record<string, StickerPlacement> = {}
		for (const given of this.#source().placed ?? []) {
			if (given.placement) byKey[given.mine ? OWN_KEY : given.id] = given.placement
		}
		if (this.ownPlacement) byKey[OWN_KEY] = this.ownPlacement
		return byKey
	})

	/** The stickers to draw, oldest first, once the catalogue knows them */
	readonly shown = $derived.by((): ShownSticker[] => {
		const { placed, mySticker, catalogue } = this.#source()
		const entries = (placed ?? []).flatMap((given) => {
			if (given.mine) return mySticker ? [{ key: OWN_KEY, slug: mySticker, own: true }] : []
			return [{ key: given.id, slug: given.sticker, own: false }]
		})
		if (mySticker && !entries.some((entry) => entry.own)) {
			entries.push({ key: OWN_KEY, slug: mySticker, own: true })
		}
		return entries.flatMap((entry) => {
			const sticker = findSticker(catalogue, entry.slug)
			return sticker ? [{ ...entry, sticker }] : []
		})
	})

	/** The viewer's sticker holds its spot and the others make room; while
	 * it's being moved it's left out, and it finds a free spot when let go */
	readonly layout = $derived(
		layoutStickers({
			entries: this.shown.map((entry) => ({
				key: entry.key,
				placement: this.placements[entry.key] ?? null
			})),
			width: this.width,
			height: this.height,
			size: this.size,
			bounds: this.bounds,
			anchored: OWN_KEY,
			excluded: this.moving
		})
	)

	position(key: string): Omit<LayoutItem, 'key'> {
		return this.layout.get(key) ?? { left: 0, top: ROW_TOP, rotation: null }
	}

	clamp(left: number, top: number): Point {
		return clampPoint(this.bounds, left, top)
	}

	toX(left: number): number {
		return toFraction(this.bounds, left)
	}

	fromX(x: number): number {
		return fromFraction(this.bounds, x)
	}

	/** Somewhere clear of everyone else's stickers, near (left, top) */
	freeSpot(left: number, top: number): Point {
		const others = [...this.layout.values()].filter((item) => item.key !== OWN_KEY)
		return freeSpot(others, this.bounds, this.size, left, top)
	}

	/** A point relative to the area */
	local(clientX: number, clientY: number): Point | null {
		const rect = this.element?.getBoundingClientRect()
		return rect ? { left: clientX - rect.left, top: clientY - rect.top } : null
	}

	/** The placement for a sticker held by its center at this point, or null
	 * outside where stickers can go. Too close to another, it goes to the
	 * nearest free spot. */
	placementAt(clientX: number, clientY: number): StickerPlacement | null {
		const at = this.local(clientX, clientY)
		if (!at || !withinBounds(this.bounds, this.size, at.left, at.top)) return null
		const { left, top } = this.freeSpot(at.left - this.size / 2, at.top - this.size / 2)
		return { x: this.toX(left), y: top, rotation: null }
	}

	/** Measures how far the card ([data-sticker-bounds]) reaches past the
	 * area, which stickers may overhang into */
	measure() {
		const card = this.element?.closest('[data-sticker-bounds]')
		if (!this.element || !card) return
		const a = this.element.getBoundingClientRect()
		const c = card.getBoundingClientRect()
		this.insets = { left: a.left - c.left, right: c.right - a.right, bottom: c.bottom - a.bottom }
	}

	/**
	 * Follows a press on the viewer's sticker: a drag moves it (leaning with
	 * the drag, and keeping the lean it had when let go), a click calls
	 * `onClick`. A move is saved with `save`; if that fails, or the pointer
	 * is lost, the sticker goes back where it was.
	 */
	pressOwn(
		event: PointerEvent,
		key: string,
		handlers: { onClick: () => void; save: (placement: StickerPlacement) => Promise<boolean> }
	) {
		const rect = this.element?.getBoundingClientRect()
		if (event.button !== 0 || !rect) return
		event.preventDefault()
		const start = this.position(key)
		const offsetX = event.clientX - rect.left - start.left
		const offsetY = event.clientY - rect.top - start.top
		const before = this.ownPlacement
		let x = this.placements[key]?.x ?? this.toX(start.left)
		let y = this.placements[key]?.y ?? start.top

		trackDrag(event, {
			start: () => {
				this.moving = key
			},
			move: (e) => {
				const at = this.clamp(e.clientX - rect.left - offsetX, e.clientY - rect.top - offsetY)
				x = this.toX(at.left)
				y = at.top
			},
			frame: (tilt) => {
				this.ownPlacement = { x, y, rotation: tilt }
			},
			drop: (_e, tilt) => {
				// Let go too close to another sticker: slide to the nearest free spot
				const spot = this.freeSpot(this.fromX(x), y)
				const placement = { x: this.toX(spot.left), y: spot.top, rotation: tilt }
				this.ownPlacement = placement
				this.moving = null
				void handlers.save(placement).then((saved) => {
					if (!saved) this.ownPlacement = before
				})
			},
			click: handlers.onClick,
			cancel: () => {
				this.ownPlacement = before
				this.moving = null
			}
		})
	}
}
