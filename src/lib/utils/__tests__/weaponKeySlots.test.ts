import { describe, expect, it } from 'vitest'
import { openKeySlots } from '../weaponKeySlots'

describe('openKeySlots', () => {
	const opus = { numWeaponKeys: 2, keySlotMinUncaps: [4, 5] }

	it("opens each slot at its series' minimum uncap", () => {
		expect(openKeySlots(opus, 3)).toEqual([])
		expect(openKeySlots(opus, 4)).toEqual([0])
		expect(openKeySlots(opus, 5)).toEqual([0, 1])
	})

	it('offers only as many slots as the weapon has (an Atma variant has one)', () => {
		const atma = { numWeaponKeys: 1, keySlotMinUncaps: [0, 0, 5] }
		expect(openKeySlots(atma, 3)).toEqual([0])
	})

	it('treats slots without a rule as open and no series as no slots', () => {
		expect(openKeySlots({ numWeaponKeys: 3, keySlotMinUncaps: [0, 0, 5] }, 4)).toEqual([0, 1])
		expect(openKeySlots({ numWeaponKeys: 2, keySlotMinUncaps: [] }, 0)).toEqual([0, 1])
		expect(openKeySlots(undefined, 5)).toEqual([])
	})
})
