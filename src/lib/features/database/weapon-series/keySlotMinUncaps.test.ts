import { describe, expect, it } from 'vitest'
import { formatKeySlotMinUncaps, keySlotMinUncapsForSave } from './keySlotMinUncaps'

describe('keySlotMinUncapsForSave', () => {
	it('sends one level per slot, with blanks as always open', () => {
		const values = { has_weapon_keys: true, num_weapon_keys: 3 }
		expect(keySlotMinUncapsForSave([null, null, 5], values)).toEqual([0, 0, 5])
		expect(keySlotMinUncapsForSave([4], values)).toEqual([4, 0, 0])
	})

	it('drops slots past the count, and everything without keys', () => {
		expect(keySlotMinUncapsForSave([4, 5], { has_weapon_keys: true, num_weapon_keys: 1 })).toEqual([
			4
		])
		expect(keySlotMinUncapsForSave([4, 5], { has_weapon_keys: false, num_weapon_keys: 2 })).toEqual(
			[]
		)
	})
})

describe('formatKeySlotMinUncaps', () => {
	it('lists each slot as a star level', () => {
		expect(formatKeySlotMinUncaps([4, 5])).toBe('4★ / 5★')
		expect(formatKeySlotMinUncaps(undefined)).toBe('')
	})
})
