import { describe, it, expect, vi } from 'vitest'

vi.mock('$lib/utils/images', () => ({
	getBasePath: () => 'https://cdn.example.com'
}))

const { buildEntityIconUrl } = await import('./entityIcon')

describe('buildEntityIconUrl', () => {
	it('returns null for nullish key', () => {
		expect(buildEntityIconUrl(null)).toBeNull()
		expect(buildEntityIconUrl(undefined)).toBeNull()
		expect(buildEntityIconUrl('')).toBeNull()
	})

	it('joins the base path with the key', () => {
		expect(buildEntityIconUrl('roles/abc.png')).toBe('https://cdn.example.com/roles/abc.png')
		expect(buildEntityIconUrl('difficulties/def.png')).toBe(
			'https://cdn.example.com/difficulties/def.png'
		)
	})

	it('strips a leading `images/` prefix', () => {
		expect(buildEntityIconUrl('images/roles/abc.png')).toBe('https://cdn.example.com/roles/abc.png')
	})

	it('strips a leading slash', () => {
		expect(buildEntityIconUrl('/roles/abc.png')).toBe('https://cdn.example.com/roles/abc.png')
	})
})

describe('buildEntityIconUrl with trailing-slash base', () => {
	it('does not produce a double slash', async () => {
		vi.resetModules()
		vi.doMock('$lib/utils/images', () => ({
			getBasePath: () => 'https://cdn.example.com/'
		}))
		const { buildEntityIconUrl: fresh } = await import('./entityIcon')
		expect(fresh('roles/x.png')).toBe('https://cdn.example.com/roles/x.png')
	})
})
