import { describe, it, expect } from 'vitest'
import { emptyEventForm, eventToForm, formToEventPayload } from '../eventLabels'
import { shortcodeFromInput } from '../shortcode'
import type { GameEvent } from '$lib/types/api/event'

describe('event form conversion', () => {
	const event: GameEvent = {
		id: 'ev',
		name: { en: 'Unite and Fight', ja: '古戦場' },
		kind: 'unite_and_fight',
		series: 'unite_and_fight',
		element: 3,
		startsAt: '2026-10-20T10:00:00Z',
		endsAt: '2026-10-27T14:59:00Z',
		status: 'draft',
		imageUrl: null,
		raids: [{ id: 'r1' } as never],
		eventNumber: 80
	}

	it('loads an event as JST form values', () => {
		expect(eventToForm(event)).toMatchObject({
			element: 3,
			startsAt: '2026-10-20T19:00',
			endsAt: '2026-10-27T23:59',
			raids: [{ id: 'r1' }]
		})
	})

	it('builds a payload with UTC times and raid ids', () => {
		expect(formToEventPayload(eventToForm(event))).toEqual({
			nameEn: 'Unite and Fight',
			nameJp: '古戦場',
			kind: 'unite_and_fight',
			series: 'unite_and_fight',
			element: 3,
			startsAt: '2026-10-20T10:00:00.000Z',
			endsAt: '2026-10-27T14:59:00.000Z',
			raidIds: ['r1'],
			eventNumber: 80
		})
	})

	it('sends the Unite and Fight number only for that kind', () => {
		expect(eventToForm({ ...event, eventNumber: null }).eventNumber).toBe(0)
		expect(formToEventPayload(eventToForm(event))?.eventNumber).toBe(80)
		// A Unite and Fight needs its number: crews look Guild Wars up by it
		expect(formToEventPayload({ ...eventToForm(event), eventNumber: 0 })).toBeNull()
		const story = { ...eventToForm(event), kind: 'story_event' as const }
		expect(formToEventPayload(story)?.eventNumber).toBeNull()
	})

	it('sends no series when none is picked', () => {
		expect(formToEventPayload({ ...eventToForm(event), series: '' })?.series).toBeNull()
	})

	it('sends no element for 0 on kinds that do not need one', () => {
		const form = { ...eventToForm(event), kind: 'story_event' as const, element: 0 }
		expect(formToEventPayload(form)?.element).toBeNull()
	})

	it('requires an element for Unite and Fight and Dread Barrage', () => {
		expect(formToEventPayload({ ...eventToForm(event), element: 0 })).toBeNull()
		const barrage = { ...eventToForm(event), kind: 'dread_barrage' as const, element: 0 }
		expect(formToEventPayload(barrage)).toBeNull()
		expect(formToEventPayload({ ...barrage, element: 2 })?.element).toBe(2)
	})

	it('rejects missing names and backwards times', () => {
		expect(formToEventPayload(emptyEventForm())).toBeNull()
		const backwards = { ...eventToForm(event), endsAt: '2026-10-19T00:00' }
		expect(formToEventPayload(backwards)).toBeNull()
	})
})

describe('shortcodeFromInput', () => {
	it('accepts a shortcode or a team URL', () => {
		expect(shortcodeFromInput('  aB3xY ')).toBe('aB3xY')
		expect(shortcodeFromInput('https://granblue.team/teams/aB3xY/characters')).toBe('aB3xY')
	})

	it('rejects anything else', () => {
		expect(shortcodeFromInput('')).toBeNull()
		expect(shortcodeFromInput('<script>')).toBeNull()
	})
})
