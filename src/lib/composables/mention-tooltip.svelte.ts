/**
 * Hover tooltip for `@`-mentions inside rendered or editable descriptions.
 * The owner renders the tooltip wrapper (`.mention-tooltip-wrapper`, bound to
 * `el`) while `entity` is set, and wires the handlers to its container.
 * Tooltips are suppressed while the user is selecting text.
 */
import { computePosition, flip, shift, offset } from '@floating-ui/dom'
import type { MentionToken } from '$lib/components/edra/extensions/entity-mention/mentions/index.js'

const WRAPPER_SELECTOR = '.mention-tooltip-wrapper'

interface MentionTooltipOptions {
	/** Matches a mention element inside the container */
	selector: string
	/** Looks up the entity for a hovered mention element */
	resolve: (target: HTMLElement) => MentionToken | null
	/** Hide the tooltip when the pointer moves onto non-mention content */
	dismissOffMention?: boolean
}

export function useMentionTooltip({
	selector,
	resolve,
	dismissOffMention = false
}: MentionTooltipOptions) {
	let entity: MentionToken | null = $state(null)
	let visible = $state(false)
	let el: HTMLDivElement | null = $state(null)
	let isSelecting = false

	function hide() {
		visible = false
		entity = null
	}

	return {
		get entity() {
			return entity
		},
		get visible() {
			return visible
		},
		/** The tooltip wrapper, for `bind:this` */
		get el() {
			return el
		},
		set el(value: HTMLDivElement | null) {
			el = value
		},

		handleMouseDown() {
			isSelecting = true
			hide()
		},

		handleMouseUp() {
			// Small delay so tooltip doesn't flash immediately after selection ends
			setTimeout(() => {
				isSelecting = false
			}, 100)
		},

		handleMentionEnter(event: MouseEvent) {
			if (isSelecting) return
			const target = (event.target as HTMLElement).closest?.(selector)
			if (!target) {
				if (dismissOffMention && visible) hide()
				return
			}

			const next = resolve(target as HTMLElement)
			if (!next) return

			entity = next
			visible = true

			// Position tooltip using Floating UI
			requestAnimationFrame(() => {
				if (!el) return
				computePosition(target as HTMLElement, el, {
					placement: 'top',
					middleware: [offset(8), flip(), shift({ padding: 8 })]
				}).then(({ x, y }) => {
					if (el) {
						el.style.left = `${x}px`
						el.style.top = `${y}px`
					}
				})
			})
		},

		handleMentionLeave(event: MouseEvent) {
			const related = event.relatedTarget as HTMLElement | null
			if (related?.closest?.(WRAPPER_SELECTOR)) return
			hide()
		},

		handleTooltipLeave(event: MouseEvent) {
			const related = event.relatedTarget as HTMLElement | null
			if (related?.closest?.(selector)) return
			hide()
		}
	}
}
