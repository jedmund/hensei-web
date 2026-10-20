/**
 * Where stickers sit in a team's sticker area: the room they may use, how
 * placements are stored, and how they're spaced so none piles on another.
 * Plain functions of the area's size, so the same inputs always give the
 * same layout (on every viewer's screen) and they can be tested alone.
 *
 * Positions are a sticker's top-left corner in px, relative to the area.
 * A placement stores x as a fraction of the horizontal range, so it
 * survives width changes, and y in px.
 */
import type { StickerPlacement } from '$lib/types/api/party'

/** A sticker's size on the team page, in px */
export const STICKER_SIZE = 60

export interface Point {
	left: number
	top: number
}

/** How far the card's edges are outside the area */
export interface Insets {
	left: number
	right: number
	bottom: number
}

/** Where a sticker's top-left corner may go */
export interface Bounds {
	minLeft: number
	maxLeft: number
	maxTop: number
}

export interface LayoutItem extends Point {
	key: string
	rotation: number | null
}

/** Closest two stickers' centers may be, as a share of their size: tilted
 * corners and borders can meet, but they never pile up */
const MIN_DISTANCE_RATIO = 0.95
/** Between unplaced stickers lined up in rows */
export const ROW_GAP = 10
/** Above the first row of unplaced stickers */
export const ROW_TOP = 20
/** Extra room while a sticker is dragged from the picker, so the card grows
 * to show where it can go */
export const DRAG_EXTRA_HEIGHT = 32

// Room above and below a single row, so tilted corners and lifts aren't
// clipped; and how much of the minimum distance each further row adds
// (rows interlock a little)
const ONE_ROW_ROOM = 40
const ROWS_ROOM = 24
const ROW_STEP_RATIO = 0.9

/** Parts two stickers exactly on top of each other: successive pairs turn
 * by the golden angle, so they spread evenly */
const GOLDEN_ANGLE = 2.39996
/** Enough spacing passes to settle a crowded team; it stops early once
 * nothing moves */
const MAX_PASSES = 150
/** The free-spot search: rings this far apart, out to this radius */
const SEARCH_STEP = 6
const SEARCH_RADIUS = 600

export function minDistance(size: number): number {
	return size * MIN_DISTANCE_RATIO
}

/** How many unplaced stickers line up in one row */
export function stickersPerRow(width: number, size: number): number {
	return Math.max(1, Math.floor(width / (size + ROW_GAP)))
}

/**
 * The area's height: one row's room, and taller for whichever needs more:
 * all `count` stickers packed at the minimum distance (a narrow screen, or
 * a popular team), or the rows the `unplaced` ones line up in. Placed
 * stickers aren't counted on their own: they were dropped inside the area,
 * and growing it to fit them would let each drop in the overhang push it
 * further. The width is only known in the browser: until then (the server
 * render) it's one row, which is right for most teams.
 */
export function areaHeight(width: number, count: number, unplaced: number, size: number): number {
	const oneRow = size + ONE_ROW_ROOM
	if (width === 0) return oneRow
	const distance = minDistance(size)
	const packedRows = Math.ceil(count / Math.max(1, Math.floor(width / distance)))
	const packed = Math.round((packedRows - 1) * distance * ROW_STEP_RATIO + size + ROWS_ROOM)
	const lineRows = Math.ceil(unplaced / stickersPerRow(width, size))
	const lined = lineRows > 0 ? ROW_TOP * 2 + lineRows * (size + ROW_GAP) - ROW_GAP : 0
	return Math.max(oneRow, packed, lined)
}

/** Stickers may hang half their size past the card's edges, but never
 * above the area, so they can't cover what's above it */
export function stickerBounds(width: number, height: number, insets: Insets, size: number): Bounds {
	const overhang = size / 2
	const minLeft = -insets.left - overhang
	const maxLeft = width + insets.right + overhang - size
	return {
		minLeft,
		maxLeft: Math.max(minLeft, maxLeft),
		maxTop: height + insets.bottom + overhang - size
	}
}

export function clampPoint(bounds: Bounds, left: number, top: number): Point {
	return {
		left: Math.min(Math.max(left, bounds.minLeft), bounds.maxLeft),
		top: Math.min(Math.max(top, 0), bounds.maxTop)
	}
}

/** A left position as the stored fraction of the horizontal range */
export function toFraction(bounds: Bounds, left: number): number {
	const span = bounds.maxLeft - bounds.minLeft
	return span > 0 ? (left - bounds.minLeft) / span : 0
}

export function fromFraction(bounds: Bounds, x: number): number {
	return bounds.minLeft + x * (bounds.maxLeft - bounds.minLeft)
}

/** Whether a point is anywhere a sticker could sit, overhang included */
export function withinBounds(bounds: Bounds, size: number, left: number, top: number): boolean {
	return (
		left >= bounds.minLeft &&
		left <= bounds.maxLeft + size &&
		top >= 0 &&
		top <= bounds.maxTop + size
	)
}

export interface LayoutInput {
	/** In order; `placement` is null for stickers nobody placed */
	entries: { key: string; placement: StickerPlacement | null }[]
	width: number
	height: number
	size: number
	bounds: Bounds
	/** Holds its spot while the others make room (the viewer's sticker) */
	anchored?: string | null
	/** Left out of the spacing (the viewer's sticker while it's moved) */
	excluded?: string | null
}

/**
 * Where every sticker is drawn: its placement (or, unplaced, a row from the
 * left), then nudged apart until none sits closer than the minimum distance
 * to another.
 */
export function layoutStickers({
	entries,
	width,
	height,
	size,
	bounds,
	anchored = null,
	excluded = null
}: LayoutInput): Map<string, LayoutItem> {
	const distanceMin = minDistance(size)
	const perRow = stickersPerRow(width, size)
	let slot = 0
	const items: LayoutItem[] = entries.map(({ key, placement }) => {
		if (placement) {
			const { left, top } = clampPoint(bounds, fromFraction(bounds, placement.x), placement.y)
			return { key, left, top, rotation: placement.rotation ?? null }
		}
		const row = Math.floor(slot / perRow)
		const left = (slot % perRow) * (size + ROW_GAP)
		slot++
		return { key, left, top: ROW_TOP + row * (size + ROW_GAP), rotation: null }
	})

	// Pushed stickers stay inside the area (spreading sideways rather than
	// spilling off the card); one placed in the overhang may stay there but
	// isn't pushed further out
	const limits = new Map(
		items.map((item) => [
			item.key,
			{
				minLeft: Math.min(0, item.left),
				maxLeft: Math.max(width - size, item.left),
				maxTop: Math.max(height - size, item.top)
			}
		])
	)
	const nudge = (item: LayoutItem, left: number, top: number) => {
		const limit = limits.get(item.key)!
		item.left = Math.min(Math.max(left, limit.minLeft), limit.maxLeft)
		item.top = Math.min(Math.max(top, 0), limit.maxTop)
	}

	const settled = items.filter((item) => item.key !== excluded)
	for (let pass = 0; pass < MAX_PASSES; pass++) {
		let moved = false
		for (let i = 0; i < settled.length; i++) {
			for (let j = i + 1; j < settled.length; j++) {
				const a = settled[i]!
				const b = settled[j]!
				let dx = b.left - a.left
				let dy = b.top - a.top
				let distance = Math.hypot(dx, dy)
				if (distance >= distanceMin) continue
				if (distance < 0.01) {
					const angle = (i + j) * GOLDEN_ANGLE
					dx = Math.cos(angle)
					dy = Math.sin(angle)
					distance = 1
				}
				const push = distanceMin - distance
				const ux = dx / distance
				const uy = dy / distance
				const aFixed = a.key === anchored
				const bFixed = b.key === anchored
				const aShare = aFixed ? 0 : bFixed ? 1 : 0.5
				const bShare = bFixed ? 0 : aFixed ? 1 : 0.5
				nudge(a, a.left - ux * push * aShare, a.top - uy * push * aShare)
				nudge(b, b.left + ux * push * bShare, b.top + uy * push * bShare)
				moved = true
			}
		}
		if (!moved) break
	}
	return new Map(items.map((item) => [item.key, item]))
}

/**
 * The nearest spot to (left, top), within bounds, that keeps the minimum
 * distance from every one of `others`, searching outward in rings; the
 * (clamped) spot itself if nothing is free
 */
export function freeSpot(
	others: Point[],
	bounds: Bounds,
	size: number,
	left: number,
	top: number
): Point {
	const distanceMin = minDistance(size)
	const fits = (l: number, t: number) =>
		others.every((other) => Math.hypot(other.left - l, other.top - t) >= distanceMin)
	const start = clampPoint(bounds, left, top)
	if (fits(start.left, start.top)) return start
	for (let radius = SEARCH_STEP; radius <= SEARCH_RADIUS; radius += SEARCH_STEP) {
		const steps = Math.max(12, Math.round(radius / 4))
		let best: Point | null = null
		for (let step = 0; step < steps; step++) {
			const angle = (step / steps) * Math.PI * 2
			const spot = clampPoint(
				bounds,
				left + Math.cos(angle) * radius,
				top + Math.sin(angle) * radius
			)
			if (!fits(spot.left, spot.top)) continue
			const away = Math.hypot(spot.left - left, spot.top - top)
			if (!best || away < Math.hypot(best.left - left, best.top - top)) best = spot
		}
		if (best) return best
	}
	return start
}
