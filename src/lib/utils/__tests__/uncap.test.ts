import { describe, it, expect } from 'vitest'
import {
	getMaxUncapLevel,
	getCharacterMaxUncapLevel,
	getSummonMaxUncapLevel,
	getDefaultMaxUncapLevel
} from '../uncap'

// ============================================================================
// getMaxUncapLevel
// ============================================================================

describe('getMaxUncapLevel', () => {
	describe('special characters', () => {
		it('returns 3 with no FLB/ULB', () => {
			expect(getMaxUncapLevel(true, false, false)).toBe(3)
		})

		it('returns 4 with FLB only', () => {
			expect(getMaxUncapLevel(true, true, false)).toBe(4)
		})

		it('returns 5 with ULB', () => {
			expect(getMaxUncapLevel(true, true, true)).toBe(5)
		})
	})

	describe('regular characters', () => {
		it('returns 4 with no FLB/ULB', () => {
			expect(getMaxUncapLevel(false, false, false)).toBe(4)
		})

		it('returns 5 with FLB only', () => {
			expect(getMaxUncapLevel(false, true, false)).toBe(5)
		})

		it('returns 6 with ULB', () => {
			expect(getMaxUncapLevel(false, true, true)).toBe(6)
		})
	})
})

// ============================================================================
// getCharacterMaxUncapLevel
// ============================================================================

describe('getCharacterMaxUncapLevel', () => {
	it('delegates to getMaxUncapLevel', () => {
		expect(getCharacterMaxUncapLevel({ special: true, uncap: { flb: true, transcendence: false } })).toBe(4)
		expect(getCharacterMaxUncapLevel({ special: false, uncap: { flb: true, transcendence: true } })).toBe(6)
	})
})

// ============================================================================
// getSummonMaxUncapLevel
// ============================================================================

describe('getSummonMaxUncapLevel', () => {
	it('returns 3 base', () => {
		expect(getSummonMaxUncapLevel({ uncap: { flb: false, ulb: false } })).toBe(3)
	})

	it('returns 4 with FLB', () => {
		expect(getSummonMaxUncapLevel({ uncap: { flb: true, ulb: false } })).toBe(4)
	})

	it('returns 5 with ULB', () => {
		expect(getSummonMaxUncapLevel({ uncap: { flb: true, ulb: true } })).toBe(5)
	})
})

// ============================================================================
// getDefaultMaxUncapLevel
// ============================================================================

describe('getDefaultMaxUncapLevel', () => {
	it('returns 5 for character', () => {
		expect(getDefaultMaxUncapLevel('character')).toBe(5)
	})

	it('returns 3 for weapon', () => {
		expect(getDefaultMaxUncapLevel('weapon')).toBe(3)
	})

	it('returns 3 for summon', () => {
		expect(getDefaultMaxUncapLevel('summon')).toBe(3)
	})
})
