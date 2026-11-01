import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('$lib/api/adapters/config', () => ({
	getImageBaseUrl: vi.fn(() => '')
}))

import { getImageBaseUrl } from '$lib/api/adapters/config'
import { getRaidCdnImage, getRaidImage } from '$lib/utils/images/raids'

const mockedGetImageBaseUrl = vi.mocked(getImageBaseUrl)

beforeEach(() => {
	mockedGetImageBaseUrl.mockReturnValue('')
})

// ============================================================================
// Raid images
// ============================================================================

describe('getRaidImage', () => {
	it('returns stored raid image by variant', () => {
		expect(getRaidImage('proto-bahamut', 'icon')).toContain('/images/raids/icon/proto-bahamut.png')
		expect(getRaidImage('proto-bahamut', 'thumbnail')).toContain(
			'/images/raids/thumbnail/proto-bahamut.png'
		)
	})

	it('defaults to thumbnail', () => {
		expect(getRaidImage('proto-bahamut')).toContain('/images/raids/thumbnail/proto-bahamut.png')
	})

	it('includes cache-busting query parameter', () => {
		expect(getRaidImage('proto-bahamut')).toMatch(/\?v=\d+$/)
	})

	it('returns generic placeholder for undefined', () => {
		expect(getRaidImage(undefined)).toContain('placeholder')
	})
})

describe('getRaidCdnImage', () => {
	it('returns icon from enemy CDN', () => {
		expect(getRaidCdnImage('icon', 12345)).toContain('/enemy/m/12345.png')
	})

	it('returns thumbnail with _high suffix', () => {
		expect(getRaidCdnImage('thumbnail', 12345)).toContain('/summon/qm/12345_high.png')
	})

	it('returns lobby with 1 suffix', () => {
		expect(getRaidCdnImage('lobby', 12345)).toContain('/lobby/123451.png')
	})

	it('returns background with raid_image_new path', () => {
		expect(getRaidCdnImage('background', 12345)).toContain('/12345/raid_image_new.png')
	})

	it('returns generic placeholder for undefined id', () => {
		expect(getRaidCdnImage('icon', undefined)).toContain('placeholder')
	})
})
