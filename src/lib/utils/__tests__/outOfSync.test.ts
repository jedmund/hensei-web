import { describe, it, expect } from 'vitest'
import { hasField, hasAnyField, hasRow, hasAnyRow } from '../outOfSync'

describe('hasField', () => {
	it('returns true when the key is present', () => {
		expect(hasField(['uncapLevel', 'transcendenceStep'], 'uncapLevel')).toBe(true)
	})

	it('returns false when the key is missing', () => {
		expect(hasField(['uncapLevel'], 'element')).toBe(false)
	})

	it('returns false for nullish or empty input', () => {
		expect(hasField(undefined, 'uncapLevel')).toBe(false)
		expect(hasField(null, 'uncapLevel')).toBe(false)
		expect(hasField([], 'uncapLevel')).toBe(false)
	})

	it('does not match a dotted key by its prefix', () => {
		expect(hasField(['bullets.0'], 'bullets')).toBe(false)
	})
})

describe('hasAnyField', () => {
	it('returns true when any one key matches', () => {
		expect(hasAnyField(['uncapLevel'], ['uncapLevel', 'transcendenceStep'])).toBe(true)
	})

	it('returns false when none match', () => {
		expect(hasAnyField(['element'], ['uncapLevel', 'transcendenceStep'])).toBe(false)
	})

	it('returns false for empty input', () => {
		expect(hasAnyField([], ['uncapLevel'])).toBe(false)
	})
})

describe('hasRow', () => {
	it('matches a dotted key by prefix and index', () => {
		expect(hasRow(['bullets.0', 'bullets.2'], 'bullets', 2)).toBe(true)
	})

	it('does not match a different index', () => {
		expect(hasRow(['bullets.0'], 'bullets', 1)).toBe(false)
	})

	it('does not match a different prefix', () => {
		expect(hasRow(['bullets.0'], 'overMastery', 0)).toBe(false)
	})
})

describe('hasAnyRow', () => {
	it('returns true when any row with the prefix is present', () => {
		expect(hasAnyRow(['overMastery.0', 'overMastery.2'], 'overMastery')).toBe(true)
	})

	it('returns false when no row with the prefix exists', () => {
		expect(hasAnyRow(['uncapLevel'], 'overMastery')).toBe(false)
	})

	it('treats a top-level key that matches the prefix as not-a-row', () => {
		expect(hasAnyRow(['bullets'], 'bullets')).toBe(false)
	})
})
