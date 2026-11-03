import { describe, expect, it } from 'vitest'
import { activeKeySkill, keySlots, openKeySlots } from '../weaponKeySlots'

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

describe('keySlots', () => {
	it('lists every slot the weapon has, open or not', () => {
		expect(keySlots({ numWeaponKeys: 2, keySlotMinUncaps: [4, 5] })).toEqual([0, 1])
		expect(keySlots({ numWeaponKeys: null, keySlotMinUncaps: [] })).toEqual([])
		expect(keySlots(undefined)).toEqual([])
	})
})

describe('activeKeySkill', () => {
	const v = (ordinal: number, minUncap: number, transcendenceStage: number) =>
		({ ordinal, minUncap, transcendenceStage, name: { en: `v${ordinal}`, ja: '' } }) as never
	const versions = [v(0, 3, 0), v(1, 5, 1), v(2, 5, 4)]

	it('picks the last version the uncap and transcendence reach', () => {
		expect(activeKeySkill(versions, 4, 0)).toMatchObject({ ordinal: 0 })
		expect(activeKeySkill(versions, 5, 3)).toMatchObject({ ordinal: 1 })
		expect(activeKeySkill(versions, 5, 5)).toMatchObject({ ordinal: 2 })
		expect(activeKeySkill(undefined, 5, 5)).toBeUndefined()
	})
})
