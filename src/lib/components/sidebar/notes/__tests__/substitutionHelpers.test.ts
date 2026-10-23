import { describe, it, expect, vi } from 'vitest'

vi.mock('$lib/features/database/detail/image', () => ({
	getCharacterImage: (id: string, _shape: string, pose: string) => `char/${id}/${pose}.png`,
	getWeaponImage: (id: string) => `weapon/${id}.png`,
	getSummonImage: (id: string) => `summon/${id}.png`,
	getPlaceholder: (type: string) => `placeholder-${type}.png`
}))

vi.mock('$lib/utils/images', () => ({
	getWeaponFallbackImage: (id: string) => `weapon-fallback/${id}.png`,
	STYLE_SWAP_POSE: 'swap',
	handleImageFallback: () => undefined
}))

vi.mock('$lib/utils/locale', () => ({
	localizedName: (n: { en?: string; ja?: string } | null | undefined) => n?.en ?? null
}))

const helpers = await import('../substitutionHelpers')

import type { Substitution } from '$lib/types/api/party'

function makeCharSub(overrides?: Partial<Substitution>): Substitution {
	return {
		id: 's1',
		position: 0,
		gridCharacter: {
			id: 'gc1',
			owned: false,
			character: {
				id: 'c1',
				granblueId: '3030000000',
				name: { en: 'Eustace', ja: 'ユーステス' },
				element: 5,
				proficiency: [1, 2],
				styleSwap: false
			}
		},
		gridWeapon: null,
		gridSummon: null,
		...overrides
	} as unknown as Substitution
}

function makeWeaponSub(overrides?: Partial<Substitution>): Substitution {
	return {
		id: 's2',
		position: 1,
		gridCharacter: null,
		gridWeapon: {
			id: 'gw1',
			owned: true,
			weapon: {
				id: 'w1',
				granblueId: '1040000000',
				name: { en: 'Sword', ja: '剣' },
				element: 2,
				proficiency: 4
			}
		},
		gridSummon: null,
		...overrides
	} as unknown as Substitution
}

function makeSummonSub(overrides?: Partial<Substitution>): Substitution {
	return {
		id: 's3',
		position: 2,
		gridCharacter: null,
		gridWeapon: null,
		gridSummon: {
			id: 'gs1',
			owned: false,
			summon: {
				id: 'su1',
				granblueId: '2040000000',
				name: { en: 'Bahamut', ja: 'バハムート' },
				element: 6
			}
		},
		...overrides
	} as unknown as Substitution
}

describe('getGridTypeName', () => {
	it('maps grid types to their Rails class names', () => {
		expect(helpers.getGridTypeName('character')).toBe('GridCharacter')
		expect(helpers.getGridTypeName('weapon')).toBe('GridWeapon')
		expect(helpers.getGridTypeName('summon')).toBe('GridSummon')
	})
})

describe('getSubstituteName', () => {
	it('picks the populated side', () => {
		expect(helpers.getSubstituteName(makeCharSub())).toBe('Eustace')
		expect(helpers.getSubstituteName(makeWeaponSub())).toBe('Sword')
		expect(helpers.getSubstituteName(makeSummonSub())).toBe('Bahamut')
	})

	it('falls back to em-dash when no side is populated', () => {
		const empty = {
			id: 'x',
			position: 0,
			gridCharacter: null,
			gridWeapon: null,
			gridSummon: null
		} as unknown as Substitution
		expect(helpers.getSubstituteName(empty)).toBe('—')
	})
})

describe('getSubstituteElement', () => {
	it('returns the element of whichever side is populated', () => {
		expect(helpers.getSubstituteElement(makeCharSub())).toBe(5)
		expect(helpers.getSubstituteElement(makeWeaponSub())).toBe(2)
		expect(helpers.getSubstituteElement(makeSummonSub())).toBe(6)
	})
})

describe('getSubstituteProficiencies', () => {
	it('returns the character proficiency array verbatim', () => {
		expect(helpers.getSubstituteProficiencies(makeCharSub())).toEqual([1, 2])
	})

	it('wraps the single weapon proficiency in an array', () => {
		expect(helpers.getSubstituteProficiencies(makeWeaponSub())).toEqual([4])
	})

	it('returns empty for summons (no proficiency)', () => {
		expect(helpers.getSubstituteProficiencies(makeSummonSub())).toEqual([])
	})
})

describe('isFromCollection', () => {
	it('uses the `owned` flag stamped per side', () => {
		expect(helpers.isFromCollection(makeWeaponSub())).toBe(true)
		expect(helpers.isFromCollection(makeCharSub())).toBe(false)
		expect(helpers.isFromCollection(makeSummonSub())).toBe(false)
	})
})

describe('getSubstituteImage', () => {
	it('routes to the character image helper with the right pose', () => {
		expect(helpers.getSubstituteImage(makeCharSub(), 'character')).toBe('char/3030000000/01.png')
	})

	it('uses STYLE_SWAP_POSE when styleSwap is set', () => {
		const sub = makeCharSub({
			gridCharacter: {
				id: 'gc1',
				owned: false,
				character: {
					id: 'c1',
					granblueId: '3030000000',
					name: { en: 'x', ja: 'x' },
					element: 1,
					styleSwap: true
				}
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
			} as any
		})
		expect(helpers.getSubstituteImage(sub, 'character')).toBe('char/3030000000/swap.png')
	})

	it('falls back to the type placeholder when no side is populated', () => {
		const empty = {
			id: 'x',
			position: 0,
			gridCharacter: null,
			gridWeapon: null,
			gridSummon: null
		} as unknown as Substitution
		expect(helpers.getSubstituteImage(empty, 'weapon')).toBe('placeholder-weapon.png')
	})
})

describe('getSubstituteFallbackImage', () => {
	it('only returns a fallback for element-0 weapons', () => {
		const elemZero = makeWeaponSub({
			gridWeapon: {
				id: 'gw1',
				owned: true,
				weapon: {
					id: 'w1',
					granblueId: '1040000000',
					name: { en: 'Sword', ja: '剣' },
					element: 0,
					proficiency: 4
				}
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
			} as any
		})
		expect(helpers.getSubstituteFallbackImage(elemZero)).toBe('weapon-fallback/1040000000.png')
		expect(helpers.getSubstituteFallbackImage(makeWeaponSub())).toBeUndefined()
		expect(helpers.getSubstituteFallbackImage(makeCharSub())).toBeUndefined()
	})
})

describe('getSubstituteItemId', () => {
	it('returns the catalog id of whichever side is populated', () => {
		expect(helpers.getSubstituteItemId(makeCharSub())).toBe('c1')
		expect(helpers.getSubstituteItemId(makeWeaponSub())).toBe('w1')
		expect(helpers.getSubstituteItemId(makeSummonSub())).toBe('su1')
	})

	it('returns null when all sides are empty', () => {
		const empty = {
			id: 'x',
			position: 0,
			gridCharacter: null,
			gridWeapon: null,
			gridSummon: null
		} as unknown as Substitution
		expect(helpers.getSubstituteItemId(empty)).toBeNull()
	})
})
