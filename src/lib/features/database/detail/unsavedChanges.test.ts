import { describe, expect, it } from 'vitest'
import { guardDecision, snapshot } from './unsavedChanges'

describe('unsaved changes guard', () => {
	it('lets clean forms and released forms navigate', () => {
		expect(guardDecision(false, false, 'link')).toBe('allow')
		expect(guardDecision(true, true, 'goto')).toBe('allow')
	})

	it('confirms in-app navigations away from a dirty form', () => {
		for (const type of ['link', 'goto', 'popstate', 'form']) {
			expect(guardDecision(true, false, type)).toBe('confirm')
		}
	})

	it('uses the browser prompt when the page unloads', () => {
		expect(guardDecision(true, false, 'leave')).toBe('native')
	})

	it('compares form state by value', () => {
		expect(snapshot({ a: 1, tags: ['x'] })).toBe(snapshot({ a: 1, tags: ['x'] }))
		expect(snapshot({ a: 1 })).not.toBe(snapshot({ a: 2 }))
		expect(snapshot(undefined)).toBe('')
	})
})
