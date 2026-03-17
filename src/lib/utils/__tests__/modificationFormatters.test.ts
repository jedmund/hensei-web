import { describe, it, expect } from 'vitest'
import {
	formatRingStat,
	formatEarringStat,
	formatAxSkill,
	getWeaponKeyTitle,
	formatUncapLevel,
	formatTranscendenceStep,
	getElementName
} from '../modificationFormatters'
import type { WeaponSeriesRef } from '$lib/types/api/weaponSeries'

function makeSeries(slug: string): WeaponSeriesRef {
	return {
		id: 's-1',
		slug,
		name: { en: slug, ja: slug },
		hasWeaponKeys: true,
		hasAwakening: false,
		augmentType: 'no_augment',
		extra: false,
		elementChangeable: false,
		numWeaponKeys: 3
	}
}

// ============================================================================
// formatRingStat
// ============================================================================

describe('formatRingStat', () => {
	it('formats ATK stat (no suffix)', () => {
		expect(formatRingStat(1, 3000)).toBe('ATK +3000')
	})

	it('formats stat with % suffix', () => {
		expect(formatRingStat(3, 15)).toBe('Debuff Success +15%')
	})

	it('returns Unknown for invalid modifier', () => {
		expect(formatRingStat(999, 10)).toBe('Unknown +10')
	})

	it('supports Japanese locale', () => {
		expect(formatRingStat(1, 3000, 'ja')).toBe('攻撃 +3000')
	})
})

// ============================================================================
// formatEarringStat
// ============================================================================

describe('formatEarringStat', () => {
	it('formats non-element stat', () => {
		expect(formatEarringStat(1, 17)).toBe('Double Attack +17%')
	})

	it('formats element-specific stat with character element', () => {
		const result = formatEarringStat(3, 22, 'en', 2)
		expect(result).toContain('Fire')
		expect(result).toContain('+22')
	})

	it('formats opposite element stat', () => {
		// Fire (2) → Water (3)
		const result = formatEarringStat(4, 12, 'en', 2)
		expect(result).toContain('Water')
	})

	it('returns Unknown for invalid modifier', () => {
		expect(formatEarringStat(999, 5)).toBe('Unknown +5')
	})
})

// ============================================================================
// formatAxSkill
// ============================================================================

describe('formatAxSkill', () => {
	it('formats AX skill with name and strength', () => {
		const ax = {
			modifier: { nameEn: 'Might', nameJp: '攻刃', slug: 'might', suffix: '%' },
			strength: 3
		} as any
		expect(formatAxSkill(ax)).toBe('Might +3%')
	})

	it('uses Japanese name with ja locale', () => {
		const ax = {
			modifier: { nameEn: 'Might', nameJp: '攻刃', slug: 'might', suffix: '%' },
			strength: 3
		} as any
		expect(formatAxSkill(ax, 'ja')).toBe('攻刃 +3%')
	})

	it('handles missing suffix', () => {
		const ax = {
			modifier: { nameEn: 'Test', nameJp: 'テスト', slug: 'test' },
			strength: 5
		} as any
		expect(formatAxSkill(ax)).toBe('Test +5')
	})
})

// ============================================================================
// getWeaponKeyTitle
// ============================================================================

describe('getWeaponKeyTitle', () => {
	it('returns Pendulums & Chains for dark-opus', () => {
		expect(getWeaponKeyTitle(makeSeries('dark-opus'))).toBe('Pendulums & Chains')
	})

	it('returns Telumas for draconic series', () => {
		expect(getWeaponKeyTitle(makeSeries('draconic'))).toBe('Telumas')
		expect(getWeaponKeyTitle(makeSeries('draconic-providence'))).toBe('Telumas')
		expect(getWeaponKeyTitle(makeSeries('superlative'))).toBe('Telumas')
	})

	it('returns Ultima Keys for ultima', () => {
		expect(getWeaponKeyTitle(makeSeries('ultima'))).toBe('Ultima Keys')
	})

	it('returns Emblems for astral', () => {
		expect(getWeaponKeyTitle(makeSeries('astral'))).toBe('Emblems')
	})

	it('returns generic Weapon Keys for unknown series', () => {
		expect(getWeaponKeyTitle(makeSeries('unknown'))).toBe('Weapon Keys')
	})

	it('returns Weapon Keys for null', () => {
		expect(getWeaponKeyTitle(null)).toBe('Weapon Keys')
		expect(getWeaponKeyTitle(undefined)).toBe('Weapon Keys')
	})
})

// ============================================================================
// formatUncapLevel / formatTranscendenceStep
// ============================================================================

describe('formatUncapLevel', () => {
	it('formats level with star', () => {
		expect(formatUncapLevel(5)).toBe('5★')
	})

	it('returns 0★ for undefined/null', () => {
		expect(formatUncapLevel(undefined)).toBe('0★')
		expect(formatUncapLevel(null)).toBe('0★')
	})
})

describe('formatTranscendenceStep', () => {
	it('formats non-zero step', () => {
		expect(formatTranscendenceStep(3)).toBe('Stage 3')
	})

	it('returns empty for 0/null/undefined', () => {
		expect(formatTranscendenceStep(0)).toBe('')
		expect(formatTranscendenceStep(null)).toBe('')
		expect(formatTranscendenceStep(undefined)).toBe('')
	})
})

// ============================================================================
// getElementName
// ============================================================================

describe('getElementName', () => {
	it('maps element IDs to names', () => {
		expect(getElementName(0)).toBe('Null')
		expect(getElementName(1)).toBe('Wind')
		expect(getElementName(2)).toBe('Fire')
		expect(getElementName(3)).toBe('Water')
		expect(getElementName(4)).toBe('Earth')
		expect(getElementName(5)).toBe('Dark')
		expect(getElementName(6)).toBe('Light')
	})

	it('returns Unknown for null/undefined/invalid', () => {
		expect(getElementName(null)).toBe('Unknown')
		expect(getElementName(undefined)).toBe('Unknown')
		expect(getElementName(99)).toBe('Unknown')
	})
})
