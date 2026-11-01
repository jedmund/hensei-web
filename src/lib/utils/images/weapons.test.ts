import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('$lib/api/adapters/config', () => ({
	getImageBaseUrl: vi.fn(() => '')
}))

import { getImageBaseUrl } from '$lib/api/adapters/config'
import {
	getWeaponBaseImage,
	getWeaponFallbackImage,
	getWeaponGachaImage,
	getWeaponGridImage,
	getWeaponImage,
	getWeaponKeyImage,
	getWeaponTransformation
} from '$lib/utils/images/weapons'

const mockedGetImageBaseUrl = vi.mocked(getImageBaseUrl)

beforeEach(() => {
	mockedGetImageBaseUrl.mockReturnValue('')
})

// ============================================================================
// getWeaponTransformation
// ============================================================================

describe('getWeaponTransformation', () => {
	it('returns undefined when weapon has no transcendence', () => {
		expect(getWeaponTransformation(false, 5, 0)).toBeUndefined()
	})

	it('returns undefined when uncap level is not 6', () => {
		expect(getWeaponTransformation(true, 5, 1)).toBeUndefined()
	})

	it('returns 02 for transcendence steps 1-4', () => {
		expect(getWeaponTransformation(true, 6, 1)).toBe('02')
		expect(getWeaponTransformation(true, 6, 4)).toBe('02')
	})

	it('returns 03 for transcendence step 5', () => {
		expect(getWeaponTransformation(true, 6, 5)).toBe('03')
	})

	it('returns undefined at uncap 6 with no transcendence steps', () => {
		expect(getWeaponTransformation(true, 6, 0)).toBeUndefined()
		expect(getWeaponTransformation(true, 6)).toBeUndefined()
	})
})

describe('getWeaponImage', () => {
	it('defaults to main variant', () => {
		expect(getWeaponImage('1040001')).toBe('/images/weapons/main/1040001.jpg')
	})

	it('returns placeholder for null', () => {
		expect(getWeaponImage(null)).toContain('placeholder')
	})

	it('adds element suffix for grid variant', () => {
		expect(getWeaponImage('1040001', 'grid', 2)).toBe('/images/weapons/grid/1040001_2.jpg?ids=game')
	})

	it('element 0 produces _0 suffix', () => {
		expect(getWeaponImage('1040001', 'grid', 0)).toBe('/images/weapons/grid/1040001_0.jpg')
	})

	it('adds transformation suffix', () => {
		expect(getWeaponImage('1040001', 'main', undefined, '02')).toBe(
			'/images/weapons/main/1040001_02.jpg'
		)
	})
})

describe('getWeaponBaseImage', () => {
	it('returns base PNG', () => {
		expect(getWeaponBaseImage('1040001')).toBe('/images/weapons/base/1040001.png')
	})
})

describe('getWeaponGachaImage', () => {
	it('returns gacha PNG', () => {
		expect(getWeaponGachaImage('1040515700')).toBe('/images/weapons/gacha/1040515700.png')
	})

	it('adds a variant suffix', () => {
		expect(getWeaponGachaImage('1040515700', '02')).toBe('/images/weapons/gacha/1040515700_02.png')
		expect(getWeaponGachaImage('1040003700', '3')).toBe('/images/weapons/gacha/1040003700_3.png')
	})

	it('returns placeholder for null', () => {
		expect(getWeaponGachaImage(null)).toContain('placeholder')
	})
})

describe('getWeaponGridImage', () => {
	it('returns grid URL without element for normal weapons', () => {
		expect(getWeaponGridImage('1040001')).toBe('/images/weapons/grid/1040001.jpg')
	})

	it('handles element-changeable weapons (element === 0) with instance element', () => {
		expect(getWeaponGridImage('1040001', 0, 3)).toBe('/images/weapons/grid/1040001_3.jpg?ids=game')
	})

	it('element-changeable without instanceElement defaults to 0', () => {
		expect(getWeaponGridImage('1040001', 0)).toBe('/images/weapons/grid/1040001_0.jpg')
	})

	it('returns placeholder for null id', () => {
		expect(getWeaponGridImage(null)).toContain('placeholder')
	})
})

describe('getWeaponKeyImage', () => {
	it('returns key image using slug directly', () => {
		expect(getWeaponKeyImage('alpha')).toBe('/images/weapons/keys/alpha.png?ids=game')
		expect(getWeaponKeyImage('pendulum')).toBe('/images/weapons/keys/pendulum.png?ids=game')
		expect(getWeaponKeyImage('elemental-teluma')).toBe(
			'/images/weapons/keys/elemental-teluma.png?ids=game'
		)
	})
})

// ============================================================================
// Weapon image fallback
// ============================================================================

describe('getWeaponFallbackImage', () => {
	it('returns URL without element suffix', () => {
		expect(getWeaponFallbackImage('1040001', 'grid')).toBe('/images/weapons/grid/1040001.jpg')
	})

	it('returns URL with transformation suffix', () => {
		expect(getWeaponFallbackImage('1040001', 'main', '02')).toBe(
			'/images/weapons/main/1040001_02.jpg'
		)
	})

	it('returns undefined for null id', () => {
		expect(getWeaponFallbackImage(null)).toBeUndefined()
	})

	it('returns undefined for undefined id', () => {
		expect(getWeaponFallbackImage(undefined)).toBeUndefined()
	})

	it('uses correct extension for base variant', () => {
		expect(getWeaponFallbackImage('1040001', 'base')).toBe('/images/weapons/base/1040001.png')
	})
})
