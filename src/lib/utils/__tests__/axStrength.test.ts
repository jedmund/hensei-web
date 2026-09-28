import { describe, it, expect } from 'vitest'
import { initialAxStrength } from '../axStrength'

describe('initialAxStrength', () => {
	const range = { min: 1, max: 3.5 }

	it('starts a new pick at the minimum', () => {
		expect(initialAxStrength(undefined, range)).toBe(1)
	})

	it('replaces a 0 strength with the minimum', () => {
		expect(initialAxStrength(0, range)).toBe(1)
	})

	it('keeps a current value that fits the range', () => {
		expect(initialAxStrength(2.5, range)).toBe(2.5)
	})

	it('resets a current value outside the range', () => {
		expect(initialAxStrength(9, range)).toBe(1)
	})
})
