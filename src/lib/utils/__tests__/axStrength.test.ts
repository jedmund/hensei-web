import { describe, it, expect } from 'vitest'
import type { WeaponStatModifier } from '$lib/types/api/weaponStatModifier'
import { initialAxStrength, secondaryAxRange } from '../axStrength'

describe('initialAxStrength', () => {
	const range = { min: 1, max: 3.5 }

	it('starts a new pick at the minimum', () => {
		expect(initialAxStrength(undefined, range)).toBe(1)
	})

	it('replaces a 0 strength with the minimum', () => {
		expect(initialAxStrength(0, range)).toBe(1)
	})

	it('keeps a current value that fits the range', () => {
		expect(initialAxStrength(2.5, range)).toBe(2.5)
	})

	it('resets a current value outside the range', () => {
		expect(initialAxStrength(9, range)).toBe(1)
	})
})

describe('secondaryAxRange', () => {
	const hp = { baseMin: 1, baseMax: 11, secondaryMin: 1, secondaryMax: 3 } as WeaponStatModifier

	it('uses the secondary range', () => {
		expect(secondaryAxRange(hp)).toEqual({ min: 1, max: 3 })
	})

	it('falls back to the base range when no secondary range is set', () => {
		const exp = { baseMin: 5, baseMax: 10 } as WeaponStatModifier
		expect(secondaryAxRange(exp)).toEqual({ min: 5, max: 10 })
	})
})
