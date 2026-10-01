import { describe, it, expect } from 'vitest'
import { safeRedirectPath } from '../safeRedirect'

describe('safeRedirectPath', () => {
	it('allows same-site paths with query and hash', () => {
		expect(safeRedirectPath('/teams/abc')).toBe('/teams/abc')
		expect(safeRedirectPath('/collection?tab=weapons#top')).toBe('/collection?tab=weapons#top')
	})

	it('falls back for missing values', () => {
		expect(safeRedirectPath(null)).toBe('/me')
		expect(safeRedirectPath(undefined)).toBe('/me')
		expect(safeRedirectPath('')).toBe('/me')
	})

	it('rejects absolute and protocol-relative URLs', () => {
		for (const next of [
			'https://evil.com',
			'//evil.com',
			'/\\evil.com',
			'/\t/evil.com',
			'/\n/evil.com',
			'javascript:alert(1)',
			'evil.com'
		]) {
			expect(safeRedirectPath(next)).toBe('/me')
		}
	})

	it('uses a custom fallback', () => {
		expect(safeRedirectPath('https://evil.com', '/')).toBe('/')
	})
})
