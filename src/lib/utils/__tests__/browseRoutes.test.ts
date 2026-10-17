import { describe, it, expect } from 'vitest'
import { explorePath, isBrowsePath } from '../browseRoutes'

describe('browseRoutes', () => {
	it('builds explore paths at the root', () => {
		expect(explorePath()).toBe('/')
		expect(explorePath('?raid=nm200&label=fast')).toBe('/?raid=nm200&label=fast')
	})

	it('selects Gallery on the gallery and on explore', () => {
		expect(isBrowsePath('/gallery', '/gallery', '/')).toBe(true)
		expect(isBrowsePath('/', '/gallery', '/')).toBe(true)
		expect(isBrowsePath('/ja', '/ja/gallery', '/ja/')).toBe(true)
		expect(isBrowsePath('/ja/gallery/', '/ja/gallery', '/ja/')).toBe(true)
	})

	it('does not select Gallery elsewhere', () => {
		expect(isBrowsePath('/crew', '/gallery', '/')).toBe(false)
		expect(isBrowsePath('/teams/abc', '/gallery', '/')).toBe(false)
	})
})
