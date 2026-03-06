import { describe, it, expect } from 'vitest'
import {
	getRingMasteryCategory,
	getRingStat,
	getEarringStat,
	getElementalizedEarringStat
} from '../masteryUtils'
import { overMastery, aetherialMastery } from '$lib/data/overMastery'

// ============================================================================
// getRingMasteryCategory
// ============================================================================

describe('getRingMasteryCategory', () => {
	it('returns primary (a) for modifiers 1-2', () => {
		expect(getRingMasteryCategory(1)).toBe(overMastery.a)
		expect(getRingMasteryCategory(2)).toBe(overMastery.a)
	})

	it('returns secondary (b) for modifiers 3-9', () => {
		expect(getRingMasteryCategory(3)).toBe(overMastery.b)
		expect(getRingMasteryCategory(9)).toBe(overMastery.b)
	})

	it('returns tertiary (c) for modifiers 10+', () => {
		expect(getRingMasteryCategory(10)).toBe(overMastery.c)
		expect(getRingMasteryCategory(15)).toBe(overMastery.c)
	})
})

// ============================================================================
// getRingStat
// ============================================================================

describe('getRingStat', () => {
	it('finds ATK (modifier 1)', () => {
		const stat = getRingStat(1)
		expect(stat).toBeDefined()
		expect(stat!.name.en).toBe('ATK')
	})

	it('finds HP (modifier 2)', () => {
		const stat = getRingStat(2)
		expect(stat!.name.en).toBe('HP')
	})

	it('finds secondary stats (3-9)', () => {
		const stat = getRingStat(3)
		expect(stat).toBeDefined()
		expect(stat!.name.en).toBe('Debuff Success')
	})

	it('finds tertiary stats (10+)', () => {
		const stat = getRingStat(10)
		expect(stat).toBeDefined()
		expect(stat!.name.en).toBe('Double Attack')
	})

	it('returns undefined for non-existent modifier', () => {
		expect(getRingStat(999)).toBeUndefined()
	})
})

// ============================================================================
// getEarringStat
// ============================================================================

describe('getEarringStat', () => {
	it('finds Double Attack (modifier 1)', () => {
		const stat = getEarringStat(1)
		expect(stat).toBeDefined()
		expect(stat!.name.en).toBe('Double Attack')
	})

	it('finds element ATK (modifier 3) with placeholder', () => {
		const stat = getEarringStat(3)
		expect(stat!.name.en).toContain('{Element}')
	})

	it('returns undefined for non-existent modifier', () => {
		expect(getEarringStat(999)).toBeUndefined()
	})
})

// ============================================================================
// getElementalizedEarringStat
// ============================================================================

describe('getElementalizedEarringStat', () => {
	it('substitutes element name for modifier 3 (en)', () => {
		const stat = getElementalizedEarringStat(3, 2, 'en')
		expect(stat).toBeDefined()
		expect(stat!.name.en).toContain('Fire')
		expect(stat!.name.en).not.toContain('{Element}')
		expect(stat!.slug).toBe('ele-2')
	})

	it('substitutes element name for modifier 3 (ja)', () => {
		const stat = getElementalizedEarringStat(3, 1, 'ja')
		expect(stat!.name.ja).toContain('風')
		expect(stat!.name.ja).not.toContain('{属性}')
	})

	it('substitutes opposite element for modifier 4', () => {
		// Fire (2) → opposite is Water (3)
		const stat = getElementalizedEarringStat(4, 2, 'en')
		expect(stat).toBeDefined()
		expect(stat!.name.en).toContain('Water')
		expect(stat!.slug).toBe('ele-3')
	})

	it('returns unmodified stat for non-element modifiers', () => {
		const stat = getElementalizedEarringStat(1, 2)
		expect(stat!.name.en).toBe('Double Attack')
	})

	it('returns undefined for non-existent modifier', () => {
		expect(getElementalizedEarringStat(999, 1)).toBeUndefined()
	})

	it('does not mutate original data', () => {
		const original = getEarringStat(3)
		const originalName = original!.name.en
		getElementalizedEarringStat(3, 2)
		expect(getEarringStat(3)!.name.en).toBe(originalName)
	})
})
