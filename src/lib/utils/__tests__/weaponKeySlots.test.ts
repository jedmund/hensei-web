import { describe, expect, it } from 'vitest'
import { isKeySlotUnlocked } from '../weaponKeySlots'

const slots = (series: string, uncap: number, ulb = true) =>
	[0, 1, 2].map((slot) => isKeySlotUnlocked(series, slot, uncap, ulb))

describe('isKeySlotUnlocked', () => {
	it('opens Dark Opus and Draconic skills 2 and 3 at 4★ and 5★', () => {
		for (const series of ['dark-opus', 'draconic']) {
			expect(slots(series, 3).slice(0, 2)).toEqual([false, false])
			expect(slots(series, 4).slice(0, 2)).toEqual([true, false])
			expect(slots(series, 5).slice(0, 2)).toEqual([true, true])
		}
	})

	it('opens both Provenance skills at 5★ and the Destroyer anklet at 4★', () => {
		expect(slots('draconic-providence', 4).slice(0, 2)).toEqual([false, false])
		expect(slots('draconic-providence', 5).slice(0, 2)).toEqual([true, true])
		expect(isKeySlotUnlocked('destroyer', 0, 3, true)).toBe(false)
		expect(isKeySlotUnlocked('destroyer', 0, 4, true)).toBe(true)
	})

	it('gives Atma weapons only the Gauph slot and opens Gate of Omnipotence at 5★', () => {
		expect(slots('ultima', 3, false)).toEqual([true, false, false])
		expect(slots('ultima', 4)).toEqual([true, true, false])
		expect(slots('ultima', 5)).toEqual([true, true, true])
	})

	it('leaves other series unrestricted', () => {
		expect(slots('superlative', 0)).toEqual([true, true, true])
	})
})
