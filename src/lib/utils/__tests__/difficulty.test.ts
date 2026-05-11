import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getTierIconUrl } from '../difficulty'
import * as images from '$lib/utils/images'

describe('getTierIconUrl', () => {
	beforeEach(() => {
		vi.restoreAllMocks()
	})

	it('returns null for null/undefined/empty imageKey', () => {
		expect(getTierIconUrl(null)).toBeNull()
		expect(getTierIconUrl(undefined)).toBeNull()
		expect(getTierIconUrl('')).toBeNull()
	})

	it('joins base + key with a single slash, even when base has a trailing slash', () => {
		vi.spyOn(images, 'getBasePath').mockReturnValue('https://cdn.example.com/images/')

		expect(getTierIconUrl('difficulties/abc.png')).toBe(
			'https://cdn.example.com/images/difficulties/abc.png'
		)
	})

	it("strips a leading `images/` prefix from the key so the base isn't duplicated", () => {
		vi.spyOn(images, 'getBasePath').mockReturnValue('https://cdn.example.com/images')

		expect(getTierIconUrl('images/difficulties/abc.png')).toBe(
			'https://cdn.example.com/images/difficulties/abc.png'
		)
	})

	it('strips a leading slash on the key (defensive against double-slashes)', () => {
		vi.spyOn(images, 'getBasePath').mockReturnValue('https://cdn.example.com/images')

		expect(getTierIconUrl('/difficulties/abc.png')).toBe(
			'https://cdn.example.com/images/difficulties/abc.png'
		)
	})

	it('preserves query params on the key (used for cache busting via ?v=updated_at)', () => {
		vi.spyOn(images, 'getBasePath').mockReturnValue('https://cdn.example.com/images')

		expect(getTierIconUrl('difficulties/abc.png?v=123')).toBe(
			'https://cdn.example.com/images/difficulties/abc.png?v=123'
		)
	})

	it('falls back to the local `/images` base when getBasePath returns the default', () => {
		vi.spyOn(images, 'getBasePath').mockReturnValue('/images')

		expect(getTierIconUrl('difficulties/abc.png')).toBe('/images/difficulties/abc.png')
	})
})
