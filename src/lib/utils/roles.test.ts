import { describe, it, expect, vi } from 'vitest'

vi.mock('$lib/utils/images', () => ({
	getBasePath: () => 'https://cdn.example.com'
}))

const { getRoleIconUrl } = await import('./roles')

describe('getRoleIconUrl', () => {
	it('returns null for nullish iconKey', () => {
		expect(getRoleIconUrl(null)).toBeNull()
		expect(getRoleIconUrl(undefined)).toBeNull()
		expect(getRoleIconUrl('')).toBeNull()
	})

	it('joins the base path with the key', () => {
		expect(getRoleIconUrl('roles/abc.png')).toBe('https://cdn.example.com/roles/abc.png')
	})

	it('strips a leading `images/` prefix', () => {
		expect(getRoleIconUrl('images/roles/abc.png')).toBe('https://cdn.example.com/roles/abc.png')
	})

	it('strips a leading slash', () => {
		expect(getRoleIconUrl('/roles/abc.png')).toBe('https://cdn.example.com/roles/abc.png')
	})
})

describe('getRoleIconUrl with trailing-slash base', () => {
	it('does not produce a double slash', async () => {
		vi.resetModules()
		vi.doMock('$lib/utils/images', () => ({
			getBasePath: () => 'https://cdn.example.com/'
		}))
		const { getRoleIconUrl: fresh } = await import('./roles')
		expect(fresh('roles/x.png')).toBe('https://cdn.example.com/roles/x.png')
	})
})
