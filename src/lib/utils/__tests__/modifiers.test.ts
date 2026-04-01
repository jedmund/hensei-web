import { describe, it, expect, vi } from 'vitest'

vi.mock('$lib/utils/images', () => ({
	getBasePath: vi.fn(() => '/images')
}))

import {
	getAwakeningImage,
	getWeaponKeyImage,
	getWeaponKeyImages,
	getAxSkillImage,
	getAxSkillImages
} from '../modifiers'
import type { WeaponKey, Awakening } from '$lib/types/api/entities'
import type { AugmentSkill } from '$lib/types/api/weaponStatModifier'

function makeKey(overrides: Partial<WeaponKey> = {}): WeaponKey {
	return {
		slug: 'alpha',
		slot: 0,
		granblueId: 10000,
		name: { en: 'Alpha', ja: 'アルファ' },
		...overrides
	} as WeaponKey
}

// ============================================================================
// getAwakeningImage
// ============================================================================

describe('getAwakeningImage', () => {
	it('returns null for undefined', () => {
		expect(getAwakeningImage(undefined)).toBeNull()
	})

	it('returns null when type has no slug', () => {
		expect(getAwakeningImage({ type: {} as unknown as Awakening })).toBeNull()
	})

	it('returns null for character-balanced', () => {
		expect(
			getAwakeningImage({ type: { slug: 'character-balanced' } as unknown as Awakening })
		).toBeNull()
	})

	it('returns jpg for character awakenings', () => {
		const url = getAwakeningImage({ type: { slug: 'character-attack' } as unknown as Awakening })
		expect(url).toBe('/images/awakening/character-attack.jpg')
	})

	it('returns png for weapon awakenings', () => {
		const url = getAwakeningImage({ type: { slug: 'attack' } as unknown as Awakening })
		expect(url).toBe('/images/awakening/attack.png')
	})
})

// ============================================================================
// getWeaponKeyImage
// ============================================================================

describe('getWeaponKeyImage', () => {
	it('returns empty string when no slug', () => {
		expect(getWeaponKeyImage(makeKey({ slug: '' }))).toBe('')
	})

	it('returns key image using slug directly', () => {
		expect(getWeaponKeyImage(makeKey())).toBe('/images/weapon-keys/alpha.png')
	})

	it('does not add any suffixes', () => {
		const key = makeKey({ slug: 'pendulum-strength', slot: 1, granblueId: 15008 })
		expect(getWeaponKeyImage(key)).toBe('/images/weapon-keys/pendulum-strength.png')
	})
})

// ============================================================================
// getWeaponKeyImages
// ============================================================================

describe('getWeaponKeyImages', () => {
	it('returns empty array for undefined/empty', () => {
		expect(getWeaponKeyImages(undefined)).toEqual([])
		expect(getWeaponKeyImages([])).toEqual([])
	})

	it('returns url/alt pairs for each key', () => {
		const keys = [
			makeKey({ slug: 'alpha' }),
			makeKey({ slug: 'beta', name: { en: 'Beta', ja: 'ベータ' } })
		]
		const result = getWeaponKeyImages(keys)
		expect(result).toHaveLength(2)
		expect(result[0]!.url).toContain('alpha')
		expect(result[0]!.alt).toBe('Alpha')
		expect(result[1]!.alt).toBe('Beta')
	})

	it('filters out keys without slugs', () => {
		const keys = [makeKey({ slug: 'alpha' }), makeKey({ slug: '' })]
		expect(getWeaponKeyImages(keys)).toHaveLength(1)
	})

	it('uses slug directly without suffixes', () => {
		const keys = [makeKey({ slug: 'strife', slot: 0 })]
		const result = getWeaponKeyImages(keys)
		expect(result[0]!.url).toBe('/images/weapon-keys/strife.png')
	})

	it('returns all entries even with duplicate slugs', () => {
		const keys = [
			makeKey({ slug: 'pendulum-supremacy', slot: 1 }),
			makeKey({ slug: 'pendulum-supremacy', slot: 2 })
		]
		const result = getWeaponKeyImages(keys)
		expect(result).toHaveLength(2)
		expect(result[0]!.url).toBe('/images/weapon-keys/pendulum-supremacy.png')
		expect(result[1]!.url).toBe('/images/weapon-keys/pendulum-supremacy.png')
	})
})

// ============================================================================
// getAxSkillImage
// ============================================================================

describe('getAxSkillImage', () => {
	it('returns null for undefined', () => {
		expect(getAxSkillImage(undefined)).toBeNull()
	})

	it('returns null when no slug', () => {
		expect(getAxSkillImage({})).toBeNull()
	})

	it('returns ax image path', () => {
		expect(getAxSkillImage({ slug: 'might' })).toBe('/images/ax/might.png')
	})
})

// ============================================================================
// getAxSkillImages
// ============================================================================

describe('getAxSkillImages', () => {
	it('returns empty for undefined/empty', () => {
		expect(getAxSkillImages(undefined)).toEqual([])
		expect(getAxSkillImages([])).toEqual([])
	})

	it('returns url/alt pairs', () => {
		const ax = [
			{ modifier: { slug: 'might', nameEn: 'Might', nameJp: '攻刃' }, strength: 3 }
		] as unknown as AugmentSkill[]
		const result = getAxSkillImages(ax)
		expect(result).toHaveLength(1)
		expect(result[0]!.url).toContain('might')
		expect(result[0]!.alt).toBe('Might')
	})

	it('filters out skills without modifier slug', () => {
		const ax = [
			{ modifier: { slug: 'might', nameEn: 'Might' }, strength: 3 },
			{ modifier: { slug: '', nameEn: '' }, strength: 1 }
		] as unknown as AugmentSkill[]
		expect(getAxSkillImages(ax)).toHaveLength(1)
	})
})
