import { describe, it, expect, vi } from 'vitest'

vi.mock('$lib/utils/images/core', () => ({
	getBasePath: vi.fn(() => '/images')
}))

const { getLocale } = vi.hoisted(() => ({ getLocale: vi.fn(() => 'en') }))
vi.mock('$lib/paraglide/runtime', async (importOriginal) => ({
	...(await importOriginal<typeof import('$lib/paraglide/runtime')>()),
	getLocale
}))

import { getProficiencyIcon } from '../proficiency'

describe('getProficiencyIcon', () => {
	it('uses the English tag by default', () => {
		expect(getProficiencyIcon(1)).toBe('/images/labels/proficiency/Label_Weapon_Sabre.png')
	})

	it('uses the Japanese tag under the Japanese locale', () => {
		getLocale.mockReturnValueOnce('ja')
		expect(getProficiencyIcon(1)).toBe('/images/labels/proficiency/ja/Label_Weapon_Sabre.png')
	})

	it('returns empty for no proficiency', () => {
		expect(getProficiencyIcon(0)).toBe('')
	})
})
