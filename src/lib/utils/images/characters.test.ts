import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('$lib/api/adapters/config', () => ({
	getImageBaseUrl: vi.fn(() => '')
}))

import { getImageBaseUrl } from '$lib/api/adapters/config'
import {
	getCharacterDetailImage,
	getCharacterImage,
	getCharacterImageWithPose,
	getCharacterPose
} from '$lib/utils/images/characters'

const mockedGetImageBaseUrl = vi.mocked(getImageBaseUrl)

beforeEach(() => {
	mockedGetImageBaseUrl.mockReturnValue('')
})

// ============================================================================
// getCharacterPose
// ============================================================================

describe('getCharacterPose', () => {
	it('returns 01 with no args', () => {
		expect(getCharacterPose()).toBe('01')
	})

	it('returns 01 for uncap <= 2', () => {
		expect(getCharacterPose(0)).toBe('01')
		expect(getCharacterPose(1)).toBe('01')
		expect(getCharacterPose(2)).toBe('01')
	})

	it('returns 02 for uncap 3-4', () => {
		expect(getCharacterPose(3)).toBe('02')
		expect(getCharacterPose(4)).toBe('02')
	})

	it('returns 03 for uncap >= 5', () => {
		expect(getCharacterPose(5)).toBe('03')
		expect(getCharacterPose(6)).toBe('03')
	})

	it('returns 04 for transcendence > 0', () => {
		expect(getCharacterPose(5, 1)).toBe('04')
		expect(getCharacterPose(6, 3)).toBe('04')
	})

	it('transcendence 0 does not trigger 04', () => {
		expect(getCharacterPose(5, 0)).toBe('03')
	})

	it('uses separate FLB and ULB poses for special characters', () => {
		expect(getCharacterPose(4, 0, false, true)).toBe('03')
		expect(getCharacterPose(5, 0, false, true)).toBe('04')
	})
})

// ============================================================================
// Convenience functions
// ============================================================================

describe('getCharacterImage', () => {
	it('defaults to main variant', () => {
		expect(getCharacterImage('3040001')).toBe('/images/characters/main/3040001_01.jpg')
	})

	it('accepts pose override', () => {
		expect(getCharacterImage('3040001', 'grid', '03')).toBe(
			'/images/characters/grid/3040001_03.jpg'
		)
	})

	it('returns placeholder for null', () => {
		expect(getCharacterImage(null)).toContain('placeholder')
	})
})

describe('getCharacterDetailImage', () => {
	it('returns detail PNG', () => {
		expect(getCharacterDetailImage('3040001', '02')).toBe(
			'/images/characters/detail/3040001_02.png'
		)
	})
})

// ============================================================================
// Special handlers
// ============================================================================

describe('getCharacterImageWithPose', () => {
	it('returns placeholder for null id', () => {
		expect(getCharacterImageWithPose(null, 'grid')).toContain('placeholder')
	})

	it('calculates pose from uncap/transcendence', () => {
		expect(getCharacterImageWithPose('3040001', 'main', 3)).toBe(
			'/images/characters/main/3040001_02.jpg'
		)
		expect(getCharacterImageWithPose('3040001', 'main', 5)).toBe(
			'/images/characters/main/3040001_03.jpg'
		)
		expect(getCharacterImageWithPose('3040001', 'main', 5, 1)).toBe(
			'/images/characters/main/3040001_04.jpg'
		)
	})

	it('null-element characters get element-suffixed images without gender by default', () => {
		const url = getCharacterImageWithPose('3030182000', 'main', 3, 0, 2, null, false, false, 0)
		expect(url).toBe('/images/characters/main/3030182000_02_02.jpg?ids=game')

		const lyria = getCharacterImageWithPose('3040643000', 'main', 3, 0, 3, null, false, false, 0)
		expect(lyria).toBe('/images/characters/main/3040643000_02_03.jpg?ids=game')
	})

	it('null-element characters get element + gender suffix when gender is provided', () => {
		const gran = getCharacterImageWithPose('3040643000', 'main', 3, 0, 3, null, false, false, 0, 0)
		expect(gran).toBe('/images/characters/main/3040643000_02_03_0.jpg?ids=game')

		const djeeta = getCharacterImageWithPose(
			'3040643000',
			'main',
			3,
			0,
			3,
			null,
			false,
			false,
			0,
			1
		)
		expect(djeeta).toBe('/images/characters/main/3040643000_02_03_1.jpg?ids=game')
	})

	it('gender suffix works for non-null-element characters too', () => {
		const gran = getCharacterImageWithPose(
			'3040001000',
			'main',
			3,
			0,
			null,
			null,
			false,
			false,
			2,
			0
		)
		expect(gran).toBe('/images/characters/main/3040001000_02_0.jpg')

		const djeeta = getCharacterImageWithPose(
			'3040001000',
			'main',
			3,
			0,
			null,
			null,
			false,
			false,
			2,
			1
		)
		expect(djeeta).toBe('/images/characters/main/3040001000_02_1.jpg')
	})

	it('null-element characters fall back to partyElement when no mainWeaponElement', () => {
		const withParty = getCharacterImageWithPose(
			'3030182000',
			'main',
			0,
			0,
			null,
			5,
			false,
			false,
			0
		)
		expect(withParty).toContain('_01_05')
	})

	it('null-element characters show base image when no party context', () => {
		const noContext = getCharacterImageWithPose(
			'3040643000',
			'main',
			0,
			0,
			null,
			null,
			false,
			false,
			0
		)
		expect(noContext).toBe('/images/characters/main/3040643000_01.jpg')
	})

	it('non-null-element characters without gender are not affected by element params', () => {
		const normal = getCharacterImageWithPose('3040001000', 'main', 3, 0, 2, null, false, false, 2)
		expect(normal).toBe('/images/characters/main/3040001000_02.jpg')
	})
})
