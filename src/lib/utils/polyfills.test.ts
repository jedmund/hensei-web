import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('toSorted polyfill', () => {
	const native = Object.getOwnPropertyDescriptor(Array.prototype, 'toSorted')!

	beforeEach(async () => {
		Reflect.deleteProperty(Array.prototype, 'toSorted')
		vi.resetModules()
		await import('./polyfills')
	})

	afterEach(() => {
		Object.defineProperty(Array.prototype, 'toSorted', native)
	})

	it('returns a sorted copy and leaves the original alone', () => {
		const original = [3, 1, 2]

		expect(original.toSorted((a, b) => a - b)).toEqual([1, 2, 3])
		expect(original).toEqual([3, 1, 2])
	})

	it('uses the default order without a comparator', () => {
		expect(['b', 'c', 'a'].toSorted()).toEqual(['a', 'b', 'c'])
	})

	it('is not enumerable, so for...in loops stay clean', () => {
		expect(Object.keys(Array.prototype)).not.toContain('toSorted')
	})
})
