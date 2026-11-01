import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('$lib/api/adapters/config', () => ({
	getImageBaseUrl: vi.fn(() => '')
}))

import { getImageBaseUrl } from '$lib/api/adapters/config'
import { getAccessoryImage, getArtifactImage, getGuidebookImage } from '$lib/utils/images/equipment'

const mockedGetImageBaseUrl = vi.mocked(getImageBaseUrl)

beforeEach(() => {
	mockedGetImageBaseUrl.mockReturnValue('')
})

describe('getAccessoryImage', () => {
	it('returns accessory URL', () => {
		expect(getAccessoryImage('399001')).toBe('/images/accessories/square/399001.jpg')
	})

	it('returns generic placeholder for undefined', () => {
		expect(getAccessoryImage(undefined)).toContain('placeholder')
	})
})

// ============================================================================
// Artifact images
// ============================================================================

describe('getArtifactImage', () => {
	it('returns square by default', () => {
		expect(getArtifactImage('500001')).toBe('/images/artifacts/square/500001.jpg')
	})

	it('returns wide variant', () => {
		expect(getArtifactImage('500001', 'wide')).toBe('/images/artifacts/wide/500001.jpg')
	})

	it('returns generic placeholder for null', () => {
		expect(getArtifactImage(null)).toContain('placeholder')
	})
})

// ============================================================================
// Other game images
// ============================================================================

describe('getGuidebookImage', () => {
	it('returns guidebook URL', () => {
		expect(getGuidebookImage('101')).toBe('/images/guidebooks/book_101.png')
	})

	it('returns generic placeholder for undefined', () => {
		expect(getGuidebookImage(undefined)).toContain('placeholder')
	})
})
