import { describe, it, expect } from 'vitest'
import {
	OPUS_DRACONIC_SLUGS,
	isOpusDraconicSeries,
	getSeriesDisplayName,
	getSeriesSlug,
	seriesHasWeaponKeys,
	seriesHasAwakening,
	seriesIsElementChangeable,
	seriesIsExtra,
	isWeaponSeriesRef
} from '../weaponSeries'
import type { WeaponSeriesRef } from '$lib/types/api/weaponSeries'

function makeSeries(overrides: Partial<WeaponSeriesRef> = {}): WeaponSeriesRef {
	return {
		id: 's-1',
		slug: 'test-series',
		name: { en: 'Test Series', ja: 'テスト' },
		hasWeaponKeys: false,
		hasAwakening: false,
		augmentType: 'no_augment',
		extra: false,
		elementChangeable: false,
		numWeaponKeys: null,
		...overrides
	}
}

// ============================================================================
// isWeaponSeriesRef type guard
// ============================================================================

describe('isWeaponSeriesRef', () => {
	it('returns true for valid WeaponSeriesRef', () => {
		expect(isWeaponSeriesRef(makeSeries())).toBe(true)
	})

	it('returns false for null/undefined', () => {
		expect(isWeaponSeriesRef(null)).toBe(false)
		expect(isWeaponSeriesRef(undefined)).toBe(false)
	})

	it('returns false for primitives', () => {
		expect(isWeaponSeriesRef(42)).toBe(false)
		expect(isWeaponSeriesRef('dark-opus')).toBe(false)
	})

	it('returns false for objects missing required fields', () => {
		expect(isWeaponSeriesRef({ slug: 'x' })).toBe(false)
		expect(isWeaponSeriesRef({ id: '1', slug: 'x' })).toBe(false)
	})
})

// ============================================================================
// isOpusDraconicSeries
// ============================================================================

describe('isOpusDraconicSeries', () => {
	it('returns true for opus/draconic slugs', () => {
		for (const slug of OPUS_DRACONIC_SLUGS) {
			expect(isOpusDraconicSeries(makeSeries({ slug }))).toBe(true)
		}
	})

	it('returns false for other series', () => {
		expect(isOpusDraconicSeries(makeSeries({ slug: 'ultima' }))).toBe(false)
	})

	it('returns false for null/undefined', () => {
		expect(isOpusDraconicSeries(null)).toBe(false)
		expect(isOpusDraconicSeries(undefined)).toBe(false)
	})
})

// ============================================================================
// getSeriesDisplayName
// ============================================================================

describe('getSeriesDisplayName', () => {
	it('returns English name by default', () => {
		expect(getSeriesDisplayName(makeSeries({ name: { en: 'Dark Opus', ja: '暗黒' } }))).toBe(
			'Dark Opus'
		)
	})

	it('returns localized name from app locale', () => {
		// localizedName() uses the app locale (defaults to 'en' in tests)
		expect(getSeriesDisplayName(makeSeries({ name: { en: 'Dark Opus', ja: '暗黒' } }))).toBe(
			'Dark Opus'
		)
	})

	it('returns Unknown for null/undefined', () => {
		expect(getSeriesDisplayName(null)).toBe('Unknown')
		expect(getSeriesDisplayName(undefined)).toBe('Unknown')
	})
})

// ============================================================================
// getSeriesSlug
// ============================================================================

describe('getSeriesSlug', () => {
	it('returns slug', () => {
		expect(getSeriesSlug(makeSeries({ slug: 'dark-opus' }))).toBe('dark-opus')
	})

	it('returns undefined for null', () => {
		expect(getSeriesSlug(null)).toBeUndefined()
	})
})

// ============================================================================
// Boolean flag helpers
// ============================================================================

describe('seriesHasWeaponKeys', () => {
	it('returns the flag value', () => {
		expect(seriesHasWeaponKeys(makeSeries({ hasWeaponKeys: true }))).toBe(true)
		expect(seriesHasWeaponKeys(makeSeries({ hasWeaponKeys: false }))).toBe(false)
	})

	it('returns false for null', () => {
		expect(seriesHasWeaponKeys(null)).toBe(false)
	})
})

describe('seriesHasAwakening', () => {
	it('returns the flag value', () => {
		expect(seriesHasAwakening(makeSeries({ hasAwakening: true }))).toBe(true)
		expect(seriesHasAwakening(makeSeries({ hasAwakening: false }))).toBe(false)
	})

	it('returns false for null', () => {
		expect(seriesHasAwakening(null)).toBe(false)
	})
})

describe('seriesIsElementChangeable', () => {
	it('returns the flag value', () => {
		expect(seriesIsElementChangeable(makeSeries({ elementChangeable: true }))).toBe(true)
		expect(seriesIsElementChangeable(makeSeries({ elementChangeable: false }))).toBe(false)
	})

	it('returns false for null', () => {
		expect(seriesIsElementChangeable(null)).toBe(false)
	})
})

describe('seriesIsExtra', () => {
	it('returns the flag value', () => {
		expect(seriesIsExtra(makeSeries({ extra: true }))).toBe(true)
		expect(seriesIsExtra(makeSeries({ extra: false }))).toBe(false)
	})

	it('returns false for null', () => {
		expect(seriesIsExtra(null)).toBe(false)
	})
})
