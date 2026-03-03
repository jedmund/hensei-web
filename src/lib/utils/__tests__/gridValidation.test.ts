import { describe, it, expect, vi } from 'vitest'
import { validateGridWeapon, validateGridCharacter, validateGridSummon } from '../gridValidation'

// Suppress console.warn from validation functions
vi.spyOn(console, 'warn').mockImplementation(() => {})

// ============================================================================
// validateGridWeapon
// ============================================================================

describe('validateGridWeapon', () => {
	it('returns null for null input', () => {
		expect(validateGridWeapon(null)).toBeNull()
	})

	it('returns null for undefined input', () => {
		expect(validateGridWeapon(undefined)).toBeNull()
	})

	it('returns null for non-object input', () => {
		expect(validateGridWeapon('string')).toBeNull()
		expect(validateGridWeapon(42)).toBeNull()
	})

	it('returns null when weapon data is missing', () => {
		expect(validateGridWeapon({ id: '1', position: 0 })).toBeNull()
	})

	it('returns null when weapon has no granblueId', () => {
		expect(validateGridWeapon({ id: '1', weapon: { name: 'test' } })).toBeNull()
	})

	it('validates data with weapon property', () => {
		const raw = { id: '1', position: 0, weapon: { granblueId: '1040001' } }
		const result = validateGridWeapon(raw)
		expect(result).not.toBeNull()
		expect(result!.weapon.granblueId).toBe('1040001')
	})

	it('normalizes legacy object property to weapon', () => {
		const raw = { id: '1', position: 0, object: { granblueId: '1040001' } }
		const result = validateGridWeapon(raw)
		expect(result).not.toBeNull()
		expect(result!.weapon.granblueId).toBe('1040001')
		expect((result as any).object).toBeUndefined()
	})

	it('prefers weapon over object when both present', () => {
		const raw = {
			id: '1',
			weapon: { granblueId: 'weapon-id' },
			object: { granblueId: 'object-id' }
		}
		const result = validateGridWeapon(raw)
		expect(result!.weapon.granblueId).toBe('weapon-id')
	})
})

// ============================================================================
// validateGridCharacter
// ============================================================================

describe('validateGridCharacter', () => {
	it('returns null for null input', () => {
		expect(validateGridCharacter(null)).toBeNull()
	})

	it('returns null for non-object input', () => {
		expect(validateGridCharacter(123)).toBeNull()
	})

	it('returns null when character data is missing', () => {
		expect(validateGridCharacter({ id: '1', position: 0 })).toBeNull()
	})

	it('returns null when character has no granblueId', () => {
		expect(validateGridCharacter({ id: '1', character: { name: 'test' } })).toBeNull()
	})

	it('validates data with character property', () => {
		const raw = { id: '1', position: 0, character: { granblueId: '3040001' } }
		const result = validateGridCharacter(raw)
		expect(result).not.toBeNull()
		expect(result!.character.granblueId).toBe('3040001')
	})

	it('normalizes legacy object property to character', () => {
		const raw = { id: '1', position: 0, object: { granblueId: '3040001' } }
		const result = validateGridCharacter(raw)
		expect(result).not.toBeNull()
		expect(result!.character.granblueId).toBe('3040001')
		expect((result as any).object).toBeUndefined()
	})
})

// ============================================================================
// validateGridSummon
// ============================================================================

describe('validateGridSummon', () => {
	it('returns null for null input', () => {
		expect(validateGridSummon(null)).toBeNull()
	})

	it('returns null for non-object input', () => {
		expect(validateGridSummon(false)).toBeNull()
	})

	it('returns null when summon data is missing', () => {
		expect(validateGridSummon({ id: '1', position: 0 })).toBeNull()
	})

	it('returns null when summon has no granblueId', () => {
		expect(validateGridSummon({ id: '1', summon: { name: 'test' } })).toBeNull()
	})

	it('validates data with summon property', () => {
		const raw = { id: '1', position: 0, summon: { granblueId: '2040001' } }
		const result = validateGridSummon(raw)
		expect(result).not.toBeNull()
		expect(result!.summon.granblueId).toBe('2040001')
	})

	it('normalizes legacy object property to summon', () => {
		const raw = { id: '1', position: 0, object: { granblueId: '2040001' } }
		const result = validateGridSummon(raw)
		expect(result).not.toBeNull()
		expect(result!.summon.granblueId).toBe('2040001')
		expect((result as any).object).toBeUndefined()
	})
})
