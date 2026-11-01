import { describe, it, expect, vi, afterEach } from 'vitest'
import { useMentionTooltip } from '../mention-tooltip.svelte'
import type { MentionToken } from '$lib/components/edra/extensions/entity-mention/mentions/index.js'

const token = {
	type: 'character',
	granblue_id: '3040000000',
	name: { en: 'Katalina', ja: 'カタリナ' }
} as MentionToken

function setup(dismissOffMention?: boolean) {
	document.body.innerHTML =
		'<div id="container"><span class="mention" data-id="1">@K</span><p id="text">x</p></div>'
	const tooltip = useMentionTooltip({
		selector: '.mention',
		resolve: (target) => (target.dataset.id === '1' ? token : null),
		dismissOffMention
	})
	const at = (id: string) => ({ target: document.querySelector(id) }) as unknown as MouseEvent
	return { tooltip, at }
}

afterEach(() => {
	vi.useRealTimers()
})

describe('useMentionTooltip', () => {
	it('shows the entity of the hovered mention', () => {
		const { tooltip, at } = setup()
		tooltip.handleMentionEnter(at('.mention'))
		expect(tooltip.entity).toEqual(token)
		expect(tooltip.visible).toBe(true)
	})

	it('keeps the tooltip over other content unless asked to dismiss', () => {
		const lingering = setup()
		lingering.tooltip.handleMentionEnter(lingering.at('.mention'))
		lingering.tooltip.handleMentionEnter(lingering.at('#text'))
		expect(lingering.tooltip.entity).toEqual(token)

		const dismissing = setup(true)
		dismissing.tooltip.handleMentionEnter(dismissing.at('.mention'))
		dismissing.tooltip.handleMentionEnter(dismissing.at('#text'))
		expect(dismissing.tooltip.entity).toBeNull()
		expect(dismissing.tooltip.visible).toBe(false)
	})

	it('suppresses tooltips while selecting, until shortly after mouseup', () => {
		vi.useFakeTimers()
		const { tooltip, at } = setup()
		tooltip.handleMentionEnter(at('.mention'))
		tooltip.handleMouseDown()
		expect(tooltip.entity).toBeNull()

		tooltip.handleMentionEnter(at('.mention'))
		expect(tooltip.entity).toBeNull()

		tooltip.handleMouseUp()
		vi.advanceTimersByTime(99)
		tooltip.handleMentionEnter(at('.mention'))
		expect(tooltip.entity).toBeNull()

		vi.advanceTimersByTime(1)
		tooltip.handleMentionEnter(at('.mention'))
		expect(tooltip.entity).toEqual(token)
	})

	it('stays open when the pointer moves between the mention and the tooltip', () => {
		const { tooltip, at } = setup()
		document.body.insertAdjacentHTML('beforeend', '<div class="mention-tooltip-wrapper"></div>')
		const wrapper = document.querySelector('.mention-tooltip-wrapper')
		const mention = document.querySelector('.mention')

		tooltip.handleMentionEnter(at('.mention'))
		tooltip.handleMentionLeave({ relatedTarget: wrapper } as unknown as MouseEvent)
		expect(tooltip.entity).toEqual(token)

		tooltip.handleTooltipLeave({ relatedTarget: mention } as unknown as MouseEvent)
		expect(tooltip.entity).toEqual(token)

		tooltip.handleTooltipLeave({ relatedTarget: document.body } as unknown as MouseEvent)
		expect(tooltip.entity).toBeNull()
	})
})
