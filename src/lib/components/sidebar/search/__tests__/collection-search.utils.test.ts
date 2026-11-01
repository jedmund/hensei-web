import { describe, it, expect } from 'vitest'
import type {
	CollectionCharacter,
	CollectionWeapon,
	CollectionSummon
} from '$lib/types/api/collection'
import type { Character, Weapon, Summon } from '$lib/types/api/entities'
import {
	getCollectionEntity,
	mapCollectionToSearchResult,
	filterCollectionByQuery,
	buildMemberOptions,
	resolveMember
} from '../collection-search.utils'
import { getAvatarSrc } from '$lib/utils/avatar'

// --- Factory helpers ---

function makeCharacterEntity(overrides: Partial<Character> = {}): Character {
	return {
		id: 'char-1',
		granblueId: '3040001000',
		name: { en: 'Gran', ja: 'グラン' },
		element: 1,
		rarity: 4,
		proficiency: [1],
		maxLevel: 80,
		maxSkillLevel: 0,
		maxAwakeningLevel: null,
		series: null,
		hp: { minHp: 0, maxHp: 0, maxHpFlb: 0, maxHpUlb: 0 },
		atk: { minAtk: 0, maxAtk: 0, maxAtkFlb: 0, maxAtkUlb: 0 },
		uncap: { flb: false, ulb: false, transcendence: false },
		...overrides
	} as Character
}

function makeWeaponEntity(overrides: Partial<Weapon> = {}): Weapon {
	return {
		id: 'wpn-1',
		granblueId: '1040001000',
		name: { en: 'Bahamut Dagger', ja: 'バハムートダガー' },
		element: 0,
		rarity: 4,
		proficiency: 1,
		maxLevel: 100,
		maxSkillLevel: 10,
		maxAwakeningLevel: null,
		series: null,
		hp: { minHp: 0, maxHp: 0, maxHpFlb: 0, maxHpUlb: 0 },
		atk: { minAtk: 0, maxAtk: 0, maxAtkFlb: 0, maxAtkUlb: 0 },
		uncap: { flb: false, ulb: false, transcendence: false },
		...overrides
	} as Weapon
}

function makeSummonEntity(overrides: Partial<Summon> = {}): Summon {
	return {
		id: 'smn-1',
		granblueId: '2040001000',
		name: { en: 'Bahamut', ja: 'バハムート' },
		element: 6,
		rarity: 4,
		maxLevel: 100,
		maxAwakeningLevel: null,
		series: null,
		hp: { minHp: 0, maxHp: 0, maxHpFlb: 0, maxHpUlb: 0 },
		atk: { minAtk: 0, maxAtk: 0, maxAtkFlb: 0, maxAtkUlb: 0 },
		uncap: { flb: false, ulb: false, transcendence: false },
		...overrides
	} as Summon
}

function makeCollectionCharacter(
	overrides: Omit<Partial<CollectionCharacter>, 'character'> & {
		character?: Partial<Character>
	} = {}
): CollectionCharacter {
	const { character: charOverrides, ...rest } = overrides
	return {
		id: 'cc-1',
		uncapLevel: 0,
		transcendenceStep: 0,
		perpetuity: false,
		overMastery: [null, null, null, null],
		aetherialMastery: null,
		awakening: null,
		character: makeCharacterEntity(charOverrides),
		createdAt: '2024-01-01T00:00:00Z',
		updatedAt: '2024-01-01T00:00:00Z',
		...rest
	}
}

function makeCollectionWeapon(
	overrides: Omit<Partial<CollectionWeapon>, 'weapon'> & { weapon?: Partial<Weapon> } = {}
): CollectionWeapon {
	const { weapon: wpnOverrides, ...rest } = overrides
	return {
		id: 'cw-1',
		uncapLevel: 0,
		transcendenceStep: 0,
		awakening: null,
		weapon: makeWeaponEntity(wpnOverrides),
		createdAt: '2024-01-01T00:00:00Z',
		updatedAt: '2024-01-01T00:00:00Z',
		...rest
	}
}

function makeCollectionSummon(
	overrides: Omit<Partial<CollectionSummon>, 'summon'> & { summon?: Partial<Summon> } = {}
): CollectionSummon {
	const { summon: smnOverrides, ...rest } = overrides
	return {
		id: 'cs-1',
		uncapLevel: 0,
		transcendenceStep: 0,
		summon: makeSummonEntity(smnOverrides),
		createdAt: '2024-01-01T00:00:00Z',
		updatedAt: '2024-01-01T00:00:00Z',
		...rest
	}
}

// --- Tests ---

describe('getCollectionEntity', () => {
	it('extracts character from CollectionCharacter', () => {
		const item = makeCollectionCharacter()
		expect(getCollectionEntity(item)).toBe(item.character)
	})

	it('extracts weapon from CollectionWeapon', () => {
		const item = makeCollectionWeapon()
		expect(getCollectionEntity(item)).toBe(item.weapon)
	})

	it('extracts summon from CollectionSummon', () => {
		const item = makeCollectionSummon()
		expect(getCollectionEntity(item)).toBe(item.summon)
	})
})

describe('mapCollectionToSearchResult', () => {
	it('maps collectionId from the collection item, not the entity', () => {
		const item = makeCollectionCharacter({
			id: 'collection-99',
			character: { id: 'entity-42' }
		})
		const result = mapCollectionToSearchResult(item)
		expect(result.collectionId).toBe('collection-99')
		expect(result.id).toBe('entity-42')
	})

	it('preserves localized name object from entity', () => {
		const item = makeCollectionWeapon({
			weapon: { name: { en: 'Sky Piercer', ja: '空裂' } }
		})
		const result = mapCollectionToSearchResult(item)
		expect(result.name).toEqual({ en: 'Sky Piercer', ja: '空裂' })
	})

	it('includes element and rarity from entity', () => {
		const item = makeCollectionSummon({
			summon: { element: 3, rarity: 4 }
		})
		const result = mapCollectionToSearchResult(item)
		expect(result.element).toBe(3)
		expect(result.rarity).toBe(4)
	})

	it('includes granblueId from entity', () => {
		const item = makeCollectionCharacter({
			character: { granblueId: '3040999000' }
		})
		const result = mapCollectionToSearchResult(item)
		expect(result.granblueId).toBe('3040999000')
	})

	it('works for all three collection types', () => {
		const char = mapCollectionToSearchResult(makeCollectionCharacter({ id: 'a' }))
		const wpn = mapCollectionToSearchResult(makeCollectionWeapon({ id: 'b' }))
		const smn = mapCollectionToSearchResult(makeCollectionSummon({ id: 'c' }))

		// Each should have its own collectionId and the correct entity id
		expect(char.collectionId).toBe('a')
		expect(char.id).toBe('char-1')
		expect(wpn.collectionId).toBe('b')
		expect(wpn.id).toBe('wpn-1')
		expect(smn.collectionId).toBe('c')
		expect(smn.id).toBe('smn-1')
	})
})

describe('filterCollectionByQuery', () => {
	const items = [
		makeCollectionCharacter({ id: 'cc-zeta', character: { name: { en: 'Zeta', ja: 'ゼタ' } } }),
		makeCollectionCharacter({
			id: 'cc-beatrix',
			character: { name: { en: 'Beatrix', ja: 'ベアトリクス' } }
		}),
		makeCollectionCharacter({
			id: 'cc-eustace',
			character: { name: { en: 'Eustace', ja: 'ユーステス' } }
		})
	]

	it('returns all items for empty query', () => {
		expect(filterCollectionByQuery(items, '')).toHaveLength(3)
	})

	it('returns all items for whitespace-only query', () => {
		expect(filterCollectionByQuery(items, '   ')).toHaveLength(3)
	})

	it('matches partial English name case-insensitively', () => {
		const result = filterCollectionByQuery(items, 'zet')
		expect(result).toHaveLength(1)
		expect(result[0]!.id).toBe('cc-zeta')
	})

	it('matches Japanese name', () => {
		const result = filterCollectionByQuery(items, 'ベア')
		expect(result).toHaveLength(1)
		expect(result[0]!.id).toBe('cc-beatrix')
	})

	it('returns empty array when nothing matches', () => {
		expect(filterCollectionByQuery(items, 'Vane')).toHaveLength(0)
	})

	it('handles empty items array', () => {
		expect(filterCollectionByQuery([], 'test')).toHaveLength(0)
	})

	it('works with CollectionWeapon items', () => {
		const weapons = [
			makeCollectionWeapon({ weapon: { name: { en: 'Sword', ja: '剣' } } }),
			makeCollectionWeapon({ weapon: { name: { en: 'Dagger', ja: '短剣' } } })
		]
		const result = filterCollectionByQuery(weapons, 'dag')
		expect(result).toHaveLength(1)
	})

	it('works with CollectionSummon items', () => {
		const summons = [
			makeCollectionSummon({ summon: { name: { en: 'Bahamut', ja: 'バハムート' } } }),
			makeCollectionSummon({ summon: { name: { en: 'Lucifer', ja: 'ルシフェル' } } })
		]
		const result = filterCollectionByQuery(summons, 'ルシ')
		expect(result).toHaveLength(1)
	})

	it('is case-insensitive for uppercase query', () => {
		const result = filterCollectionByQuery(items, 'EUSTACE')
		expect(result).toHaveLength(1)
		expect(result[0]!.id).toBe('cc-eustace')
	})
})

describe('buildMemberOptions', () => {
	const members = [
		{ userId: 'u-other', username: 'Other', avatarPicture: 'other' },
		{ userId: 'u-self', username: 'Me', avatarPicture: 'me' }
	]

	it('lists the signed-in user first, marked as You', () => {
		const options = buildMemberOptions(members, 'u-self', undefined)
		expect(options.map((o) => o.value)).toEqual(['u-self', 'u-other'])
		expect(options[0]).toEqual({
			value: 'u-self',
			label: 'Me',
			image: getAvatarSrc('me'),
			suffix: 'You'
		})
		expect(options[1]).toEqual({ value: 'u-other', label: 'Other', image: getAvatarSrc('other') })
	})

	it('falls back to "You" when the user is not in the crew list', () => {
		const options = buildMemberOptions([], 'u-self', undefined)
		expect(options).toEqual([{ value: 'u-self', label: 'You', image: undefined, suffix: 'You' }])
	})

	it('has no self entry when signed out', () => {
		expect(buildMemberOptions(members, undefined, undefined).map((o) => o.value)).toEqual([
			'u-other',
			'u-self'
		])
	})

	it('appends an external user once', () => {
		const external = { id: 'u-ext', username: 'Ext', avatar: { picture: 'ext' } }
		const options = buildMemberOptions(members, 'u-self', external)
		expect(options.at(-1)).toEqual({ value: 'u-ext', label: 'Ext', image: getAvatarSrc('ext') })
		const already = buildMemberOptions(members, 'u-self', { ...external, id: 'u-other' })
		expect(already).toHaveLength(2)
	})
})

describe('resolveMember', () => {
	const members = [{ userId: 'u-other', username: 'Other', avatarPicture: 'other' }]
	const external = { id: 'u-ext', username: 'Ext', avatar: { picture: 'ext' } }

	it('returns undefined without a user id', () => {
		expect(resolveMember(undefined, members, 'u-self', external)).toBeUndefined()
	})

	it('resolves the signed-in user, defaulting to "You"', () => {
		expect(resolveMember('u-self', members, 'u-self', external)).toEqual({
			label: 'You',
			image: undefined
		})
	})

	it('resolves crew members and the external user', () => {
		expect(resolveMember('u-other', members, 'u-self', external)).toEqual({
			label: 'Other',
			image: getAvatarSrc('other')
		})
		expect(resolveMember('u-ext', members, 'u-self', external)).toEqual({
			label: 'Ext',
			image: getAvatarSrc('ext')
		})
	})

	it('returns undefined for an unknown user', () => {
		expect(resolveMember('u-nobody', members, 'u-self', undefined)).toBeUndefined()
	})
})
