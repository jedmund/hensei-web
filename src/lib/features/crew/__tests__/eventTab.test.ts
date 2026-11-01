import { describe, it, expect } from 'vitest'
import { eventTabFromUrl, urlForEventTab } from '../eventTab'

describe('eventTabFromUrl', () => {
	it('defaults to the individual tab', () => {
		expect(eventTabFromUrl(new URL('https://granblue.team/crew/events/80'))).toBe('individual')
	})

	it('selects the crew tab from a bare ?crew param', () => {
		expect(eventTabFromUrl(new URL('https://granblue.team/crew/events/80?crew'))).toBe('crew')
		expect(eventTabFromUrl(new URL('https://granblue.team/crew/events/80?x=1&crew='))).toBe('crew')
	})
})

describe('urlForEventTab', () => {
	it('adds the crew param for the crew tab', () => {
		const url = new URL('https://granblue.team/crew/events/80?x=1')
		expect(urlForEventTab(url, 'crew').search).toBe('?x=1&crew=')
	})

	it('removes the crew param for the individual tab', () => {
		const url = new URL('https://granblue.team/crew/events/80?crew=&x=1')
		expect(urlForEventTab(url, 'individual').search).toBe('?x=1')
	})

	it('leaves the original URL alone', () => {
		const url = new URL('https://granblue.team/crew/events/80')
		urlForEventTab(url, 'crew')
		expect(url.search).toBe('')
	})

	it('round-trips through eventTabFromUrl', () => {
		const url = new URL('https://granblue.team/crew/events/80')
		expect(eventTabFromUrl(urlForEventTab(url, 'crew'))).toBe('crew')
		expect(eventTabFromUrl(urlForEventTab(urlForEventTab(url, 'crew'), 'individual'))).toBe(
			'individual'
		)
	})
})
