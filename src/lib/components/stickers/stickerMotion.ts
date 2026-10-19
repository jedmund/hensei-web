/**
 * How stickers arrive in and leave the sticker area. Each honours the
 * viewer's reduced-motion setting by not moving at all.
 */
import { cubicIn } from 'svelte/easing'
import type { TransitionConfig } from 'svelte/transition'
import { prefersReducedMotion } from '$lib/utils/motion'
import type { StickerDrop } from './stickerDrag.svelte'

const SETTLE = 'cubic-bezier(0.2, 0.8, 0.2, 1)'
/** Between each sticker of a batch slapping down */
const REVEAL_STAGGER = 90

/** Fades in and slaps down; `order` staggers a batch so they land in turn */
export function revealSticker(el: HTMLElement, order: number, rotation: number | null) {
	if (prefersReducedMotion()) return
	const turn = `rotate(${rotation ?? 0}deg)`
	el.animate(
		[
			{ opacity: 0, transform: `${turn} translateY(-10px) scale(1.25)` },
			{ opacity: 1, transform: `${turn} scale(0.94)`, offset: 0.7 },
			{ opacity: 1, transform: `${turn} scale(1)` }
		],
		{
			duration: 300,
			delay: order * REVEAL_STAGGER,
			easing: SETTLE,
			// Hidden until its turn
			fill: 'backwards'
		}
	)
}

/** From where and how the dragged sticker was let go, pressed down onto
 * the card */
export function landSticker(el: HTMLElement, drop: StickerDrop) {
	if (prefersReducedMotion()) return
	const rect = el.getBoundingClientRect()
	const dx = drop.clientX - (rect.left + rect.width / 2)
	const dy = drop.clientY - (rect.top + rect.height / 2)
	const turn = `rotate(${drop.tilt}deg)`
	el.animate(
		[
			{ transform: `translate(${dx}px, ${dy}px) ${turn} scale(${drop.scale})` },
			{ transform: `${turn} scale(0.94)`, offset: 0.7 },
			{ transform: `${turn} scale(1)` }
		],
		{ duration: 280, easing: SETTLE }
	)
}

/** Leaving (folding the area, or taking yours back): fades as it lifts a
 * little. `translate`, so the sticker keeps its rotation. */
export const liftAway: (node: Element) => TransitionConfig = () => ({
	duration: prefersReducedMotion() ? 0 : 180,
	easing: cubicIn,
	css: (t, u) => `opacity: ${t}; translate: 0 ${-u * 10}px`
})
