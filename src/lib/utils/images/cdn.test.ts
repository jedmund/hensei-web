import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('$lib/api/adapters/config', () => ({
	getImageBaseUrl: vi.fn(() => '')
}))

import { getImageBaseUrl } from '$lib/api/adapters/config'
import {
	getGameCdnCharacterImage,
	getGameCdnSummonImage,
	getGameCdnWeaponImage
} from '$lib/utils/images/cdn'

const mockedGetImageBaseUrl = vi.mocked(getImageBaseUrl)

beforeEach(() => {
	mockedGetImageBaseUrl.mockReturnValue('')
})

// ============================================================================
// Game CDN images
// ============================================================================

describe('getGameCdnCharacterImage', () => {
	it('returns CDN URL with pose', () => {
		expect(getGameCdnCharacterImage('3040001')).toContain('npc/s/3040001_01.jpg')
	})

	it('accepts custom pose', () => {
		expect(getGameCdnCharacterImage('3040001', '03')).toContain('npc/s/3040001_03.jpg')
	})

	it('returns placeholder for null', () => {
		expect(getGameCdnCharacterImage(null)).toContain('placeholder')
	})
})

describe('getGameCdnWeaponImage', () => {
	it('returns CDN URL', () => {
		expect(getGameCdnWeaponImage('1040001')).toContain('weapon/s/1040001.jpg')
	})

	it('returns placeholder for null', () => {
		expect(getGameCdnWeaponImage(null)).toContain('placeholder')
	})
})

describe('getGameCdnSummonImage', () => {
	it('returns CDN URL', () => {
		expect(getGameCdnSummonImage('2040001')).toContain('summon/s/2040001.jpg')
	})

	it('returns placeholder for null', () => {
		expect(getGameCdnSummonImage(null)).toContain('placeholder')
	})
})
