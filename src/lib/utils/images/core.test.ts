import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('$lib/api/adapters/config', () => ({
	getImageBaseUrl: vi.fn(() => '')
}))

import { getImageBaseUrl } from '$lib/api/adapters/config'
import {
	getBasePath,
	getGenericPlaceholder,
	getHostedImageUrl,
	getImageUrl,
	getPlaceholderImage,
	handleImageFallback
} from '$lib/utils/images/core'
import { getCharacterImage } from '$lib/utils/images/characters'
import { getWeaponImage } from '$lib/utils/images/weapons'
import { getSummonImage } from '$lib/utils/images/summons'

const mockedGetImageBaseUrl = vi.mocked(getImageBaseUrl)

beforeEach(() => {
	mockedGetImageBaseUrl.mockReturnValue('')
})

// ============================================================================
// getBasePath
// ============================================================================

describe('getBasePath', () => {
	it('returns /images when no remote URL configured', () => {
		expect(getBasePath()).toBe('/images')
	})

	it('returns remote URL when configured', () => {
		mockedGetImageBaseUrl.mockReturnValue('https://cdn.example.com')
		expect(getBasePath()).toBe('https://cdn.example.com')
	})
})

// ============================================================================
// Placeholders
// ============================================================================

describe('getPlaceholderImage', () => {
	it('returns placeholder path for each type/variant combo', () => {
		expect(getPlaceholderImage('character', 'grid')).toBe(
			'/images/app/placeholders/placeholder-character-grid.png'
		)
		expect(getPlaceholderImage('weapon', 'main')).toBe(
			'/images/app/placeholders/placeholder-weapon-main.png'
		)
		expect(getPlaceholderImage('summon', 'square')).toBe(
			'/images/app/placeholders/placeholder-summon-square.png'
		)
	})
})

describe('getGenericPlaceholder', () => {
	it('returns weapon-grid placeholder', () => {
		expect(getGenericPlaceholder()).toBe('/images/app/placeholders/placeholder-weapon-grid.png')
	})
})

// ============================================================================
// getImageUrl
// ============================================================================

describe('getImageUrl', () => {
	it('returns placeholder when id is null/undefined', () => {
		expect(getImageUrl('character', null, 'grid')).toBe(
			'/images/app/placeholders/placeholder-character-grid.png'
		)
		expect(getImageUrl('weapon', undefined, 'main')).toBe(
			'/images/app/placeholders/placeholder-weapon-main.png'
		)
	})

	it('returns character URL with pose', () => {
		expect(getImageUrl('character', '3040001', 'main', { pose: '02' })).toBe(
			'/images/characters/main/3040001_02.jpg'
		)
	})

	it('defaults character pose to 01', () => {
		expect(getImageUrl('character', '3040001', 'grid')).toBe(
			'/images/characters/grid/3040001_01.jpg'
		)
	})

	it('returns weapon URL without element', () => {
		expect(getImageUrl('weapon', '1040001', 'main')).toBe('/images/weapons/main/1040001.jpg')
	})

	it('returns weapon grid URL with element suffix', () => {
		expect(getImageUrl('weapon', '1040001', 'grid', { element: 3 })).toBe(
			'/images/weapons/grid/1040001_3.jpg?ids=game'
		)
	})

	it('weapon grid element 0 is valid', () => {
		expect(getImageUrl('weapon', '1040001', 'grid', { element: 0 })).toBe(
			'/images/weapons/grid/1040001_0.jpg'
		)
	})

	it('returns summon URL', () => {
		expect(getImageUrl('summon', '2040001', 'main')).toBe('/images/summons/main/2040001.jpg')
	})

	describe('file extensions', () => {
		it('uses .png for character-detail', () => {
			expect(getImageUrl('character', '3040001', 'detail', { pose: '01' })).toMatch(/\.png$/)
		})

		it('uses .png for weapon-base', () => {
			expect(getImageUrl('weapon', '1040001', 'base')).toMatch(/\.png$/)
		})

		it('uses .png for summon-detail', () => {
			expect(getImageUrl('summon', '2040001', 'detail')).toMatch(/\.png$/)
		})

		it('uses .png for weapon-gacha and summon-gacha', () => {
			expect(getImageUrl('weapon', '1040001', 'gacha')).toBe('/images/weapons/gacha/1040001.png')
			expect(getImageUrl('summon', '2040001', 'gacha')).toBe('/images/summons/gacha/2040001.png')
		})

		it('uses .jpg for everything else', () => {
			expect(getImageUrl('character', '3040001', 'grid')).toMatch(/\.jpg$/)
			expect(getImageUrl('weapon', '1040001', 'main')).toMatch(/\.jpg$/)
			expect(getImageUrl('summon', '2040001', 'grid')).toMatch(/\.jpg$/)
		})
	})
})

// ============================================================================
// Remote URL integration
// ============================================================================

describe('with remote base URL', () => {
	beforeEach(() => {
		mockedGetImageBaseUrl.mockReturnValue('https://cdn.example.com')
	})

	it('prefixes all paths with remote URL', () => {
		expect(getCharacterImage('3040001')).toMatch(/^https:\/\/cdn\.example\.com\//)
		expect(getWeaponImage('1040001')).toMatch(/^https:\/\/cdn\.example\.com\//)
		expect(getSummonImage('2040001')).toMatch(/^https:\/\/cdn\.example\.com\//)
		expect(getPlaceholderImage('character', 'grid')).toMatch(/^https:\/\/cdn\.example\.com\//)
	})
})

describe('handleImageFallback', () => {
	it('swaps src to fallback URL', () => {
		const img = { src: 'https://cdn.example.com/weapons/grid/1040001_0.jpg' } as HTMLImageElement
		const event = { currentTarget: img } as unknown as Event
		handleImageFallback(event, 'https://cdn.example.com/weapons/grid/1040001.jpg')
		expect(img.src).toBe('https://cdn.example.com/weapons/grid/1040001.jpg')
	})

	it('does not swap when fallback matches current src', () => {
		const img = { src: 'https://cdn.example.com/weapons/grid/1040001.jpg' } as HTMLImageElement
		const event = { currentTarget: img } as unknown as Event
		handleImageFallback(event, 'https://cdn.example.com/weapons/grid/1040001.jpg')
		expect(img.src).toBe('https://cdn.example.com/weapons/grid/1040001.jpg')
	})

	it('does nothing when no fallback provided', () => {
		const img = { src: 'https://cdn.example.com/weapons/grid/1040001_0.jpg' } as HTMLImageElement
		const event = { currentTarget: img } as unknown as Event
		handleImageFallback(event, undefined)
		expect(img.src).toBe('https://cdn.example.com/weapons/grid/1040001_0.jpg')
	})
})

describe('getHostedImageUrl', () => {
	it('prefixes host-relative API paths with the image host', () => {
		mockedGetImageBaseUrl.mockReturnValue('https://cdn.example.com')
		expect(getHostedImageUrl('icons/stickers/cleared.png?v=1')).toBe(
			'https://cdn.example.com/icons/stickers/cleared.png?v=1'
		)
	})

	it('falls back to the local images path without a host', () => {
		mockedGetImageBaseUrl.mockReturnValue('')
		expect(getHostedImageUrl('events/abc.webp?v=2')).toBe('/images/events/abc.webp?v=2')
	})

	it('passes absolute URLs, root paths and blobs through', () => {
		expect(getHostedImageUrl('https://x.test/a.png')).toBe('https://x.test/a.png')
		expect(getHostedImageUrl('/images/a.png')).toBe('/images/a.png')
		expect(getHostedImageUrl('blob:abc')).toBe('blob:abc')
	})

	it('returns null for missing paths', () => {
		expect(getHostedImageUrl(null)).toBeNull()
		expect(getHostedImageUrl(undefined)).toBeNull()
	})
})
