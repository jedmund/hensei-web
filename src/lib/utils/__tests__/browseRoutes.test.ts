import { describe, it, expect } from 'vitest'
import { galleryPath, isHomePath } from '../browseRoutes'

describe('browseRoutes', () => {
	it('builds gallery paths', () => {
		expect(galleryPath()).toBe('/gallery')
		expect(galleryPath('?raid=nm200&label=fast')).toBe('/gallery?raid=nm200&label=fast')
	})

	it('selects Home only on the home page', () => {
		expect(isHomePath('/', '/')).toBe(true)
		expect(isHomePath('/ja', '/ja/')).toBe(true)
		expect(isHomePath('/ja/', '/ja')).toBe(true)
	})

	it('does not select Home elsewhere', () => {
		expect(isHomePath('/gallery', '/')).toBe(false)
		expect(isHomePath('/ja/gallery', '/ja/')).toBe(false)
		expect(isHomePath('/crew', '/')).toBe(false)
	})
})
