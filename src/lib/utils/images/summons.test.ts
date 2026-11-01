import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('$lib/api/adapters/config', () => ({
	getImageBaseUrl: vi.fn(() => '')
}))

import { getImageBaseUrl } from '$lib/api/adapters/config'
import {
	getSummonDetailImage,
	getSummonGachaImage,
	getSummonImage,
	getSummonTransformation,
	getSummonTransformationStages,
	getSummonWideImage
} from '$lib/utils/images/summons'

const mockedGetImageBaseUrl = vi.mocked(getImageBaseUrl)

beforeEach(() => {
	mockedGetImageBaseUrl.mockReturnValue('')
})

// ============================================================================
// getSummonTransformation
// ============================================================================

describe('getSummonTransformation', () => {
	const PRIMAL_SUMMON = '2040094000' // Agni (first upgrade at uncap 5)
	const OMEGA_SUMMON = '2040020000' // Tiamat Omega (first upgrade at uncap 4)

	it('returns undefined for summons not in the alt art set', () => {
		expect(getSummonTransformation('9999999999', 5)).toBeUndefined()
	})

	it('returns undefined for null/undefined id', () => {
		expect(getSummonTransformation(null, 5)).toBeUndefined()
		expect(getSummonTransformation(undefined, 5)).toBeUndefined()
	})

	it('returns undefined for base uncap (below threshold)', () => {
		expect(getSummonTransformation(PRIMAL_SUMMON, 4)).toBeUndefined()
		expect(getSummonTransformation(OMEGA_SUMMON, 3)).toBeUndefined()
	})

	it('returns 02 for first upgrade (at per-summon threshold)', () => {
		// Primal: threshold 5
		expect(getSummonTransformation(PRIMAL_SUMMON, 5)).toBe('02')
		expect(getSummonTransformation(PRIMAL_SUMMON, 5, 0)).toBe('02')
		// Omega: threshold 4
		expect(getSummonTransformation(OMEGA_SUMMON, 4)).toBe('02')
		expect(getSummonTransformation(OMEGA_SUMMON, 5)).toBe('02')
		expect(getSummonTransformation(OMEGA_SUMMON, 5, 0)).toBe('02')
	})

	it('returns 03 for second upgrade (uncap 6)', () => {
		expect(getSummonTransformation(PRIMAL_SUMMON, 6)).toBe('03')
		expect(getSummonTransformation(PRIMAL_SUMMON, 6, 0)).toBe('03')
		expect(getSummonTransformation(PRIMAL_SUMMON, 6, 4)).toBe('03')
		expect(getSummonTransformation(OMEGA_SUMMON, 6)).toBe('03')
		expect(getSummonTransformation(OMEGA_SUMMON, 6, 4)).toBe('03')
	})

	it('returns 04 for third upgrade (uncap 6 + transcendence 5)', () => {
		expect(getSummonTransformation(PRIMAL_SUMMON, 6, 5)).toBe('04')
		expect(getSummonTransformation(PRIMAL_SUMMON, 6, 6)).toBe('04')
		expect(getSummonTransformation(OMEGA_SUMMON, 6, 5)).toBe('04')
	})

	it('accepts numeric id', () => {
		expect(getSummonTransformation(2040094000, 5)).toBe('02')
	})

	describe('summons with ULB art only (e.g. Odious)', () => {
		const ODIOUS_SUMMON = '2040446000' // Belmervolk

		it('returns undefined below ULB', () => {
			expect(getSummonTransformation(ODIOUS_SUMMON, 4, undefined, true)).toBeUndefined()
			expect(getSummonTransformation(ODIOUS_SUMMON, undefined, undefined, true)).toBeUndefined()
		})

		it('returns 02 from ULB', () => {
			expect(getSummonTransformation(ODIOUS_SUMMON, 5, undefined, true)).toBe('02')
		})

		it('never returns transcendence art', () => {
			expect(getSummonTransformation(ODIOUS_SUMMON, 6, undefined, true)).toBe('02')
			expect(getSummonTransformation(ODIOUS_SUMMON, 6, 5, true)).toBe('02')
		})

		it('keeps base art without the flag', () => {
			expect(getSummonTransformation(ODIOUS_SUMMON, 5)).toBeUndefined()
		})
	})
})

describe('getSummonTransformationStages', () => {
	it('returns Base only for summons without alt art', () => {
		expect(getSummonTransformationStages('9999999999').map((s) => s.suffix)).toEqual([undefined])
	})

	it('returns every stage for mapped summons', () => {
		expect(getSummonTransformationStages('2040094000').map((s) => s.suffix)).toEqual([
			undefined,
			'02',
			'03',
			'04'
		])
	})

	it('returns Base and ULB for summons with ULB art only', () => {
		expect(getSummonTransformationStages('2040446000', true)).toEqual([
			{ id: '01', label: 'Base', suffix: undefined },
			{ id: '02', label: 'ULB', suffix: '02' }
		])
	})
})

describe('getSummonImage', () => {
	it('defaults to main', () => {
		expect(getSummonImage('2040001')).toBe('/images/summons/main/2040001.jpg')
	})

	it('adds transformation suffix', () => {
		expect(getSummonImage('2040001', 'main', '02')).toBe('/images/summons/main/2040001_02.jpg')
	})

	it('returns placeholder for null', () => {
		expect(getSummonImage(null)).toContain('placeholder')
	})
})

describe('getSummonDetailImage', () => {
	it('returns detail PNG', () => {
		expect(getSummonDetailImage('2040001')).toBe('/images/summons/detail/2040001.png')
	})
})

describe('getSummonGachaImage', () => {
	it('returns gacha PNG', () => {
		expect(getSummonGachaImage('2040003000')).toBe('/images/summons/gacha/2040003000.png')
	})

	it('adds a transformation suffix', () => {
		expect(getSummonGachaImage('2040003000', '02')).toBe('/images/summons/gacha/2040003000_02.png')
	})

	it('returns placeholder for null', () => {
		expect(getSummonGachaImage(undefined)).toContain('placeholder')
	})
})

describe('getSummonWideImage', () => {
	it('returns wide JPG', () => {
		expect(getSummonWideImage('2040001')).toBe('/images/summons/wide/2040001.jpg')
	})
})
