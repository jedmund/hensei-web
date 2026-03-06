import { describe, it, expect, vi } from 'vitest'

vi.mock('$lib/utils/images', () => ({
	getBasePath: vi.fn(() => '/images')
}))

vi.mock('$lib/types/api/weaponSeries', () => ({
	isWeaponSeriesRef: vi.fn((s: any) => s !== null && typeof s === 'object' && 'slug' in s && 'id' in s && 'name' in s)
}))

import {
	getAwakeningImage,
	getWeaponKeyImage,
	getWeaponKeyImages,
	getAxSkillImage,
	getAxSkillImages
} from '../modifiers'
import type { WeaponKey } from '$lib/types/api/entities'
import type { WeaponSeriesRef } from '$lib/types/api/weaponSeries'

function makeKey(overrides: Partial<WeaponKey> = {}): WeaponKey {
	return {
		slug: 'alpha',
		slot: 0,
		granblue_id: 10000,
		name: { en: 'Alpha', ja: 'アルファ' },
		...overrides
	} as WeaponKey
}

function makeSeries(slug: string): WeaponSeriesRef {
	return {
		id: 's-1',
		slug,
		name: { en: slug, ja: slug },
		hasWeaponKeys: true,
		hasAwakening: false,
		augmentType: 'no_augment',
		extra: false,
		elementChangeable: false
	}
}

// ============================================================================
// getAwakeningImage
// ============================================================================

describe('getAwakeningImage', () => {
	it('returns null for undefined', () => {
		expect(getAwakeningImage(undefined)).toBeNull()
	})

	it('returns null when type has no slug', () => {
		expect(getAwakeningImage({ type: {} as any })).toBeNull()
	})

	it('returns null for character-balanced', () => {
		expect(getAwakeningImage({ type: { slug: 'character-balanced' } as any })).toBeNull()
	})

	it('returns jpg for character awakenings', () => {
		const url = getAwakeningImage({ type: { slug: 'character-attack' } as any })
		expect(url).toBe('/images/awakening/character-attack.jpg')
	})

	it('returns png for weapon awakenings', () => {
		const url = getAwakeningImage({ type: { slug: 'attack' } as any })
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

	it('returns basic key image', () => {
		expect(getWeaponKeyImage(makeKey())).toBe('/images/weapon-keys/alpha.png')
	})

	it('adds element suffix for elemental teluma keys', () => {
		const key = makeKey({ slug: 'teluma', granblue_id: 15008 })
		expect(getWeaponKeyImage(key, 3)).toBe('/images/weapon-keys/teluma-3.png')
	})

	it('does not add element for non-teluma keys', () => {
		const key = makeKey({ slug: 'alpha', granblue_id: 10000 })
		expect(getWeaponKeyImage(key, 3)).toBe('/images/weapon-keys/alpha.png')
	})

	it('adds proficiency suffix for ultima slot 0', () => {
		const key = makeKey({ slug: 'strife', slot: 0 })
		expect(getWeaponKeyImage(key, undefined, 1, makeSeries('ultima'))).toBe(
			'/images/weapon-keys/strife-1.png'
		)
	})

	it('does not add proficiency for non-ultima', () => {
		const key = makeKey({ slug: 'strife', slot: 0 })
		expect(getWeaponKeyImage(key, undefined, 1, makeSeries('dark-opus'))).toBe(
			'/images/weapon-keys/strife.png'
		)
	})

	it('adds mod and element suffix for dark-opus slot 1 pendulums', () => {
		const key = makeKey({ slug: 'pendulum-strength', slot: 1 })
		const url = getWeaponKeyImage(
			key,
			2,
			undefined,
			makeSeries('dark-opus'),
			{ en: 'Repudiation' }
		)
		expect(url).toBe('/images/weapon-keys/pendulum-strength-primal-2.png')
	})

	it('uses magna for non-Repudiation opus weapons', () => {
		const key = makeKey({ slug: 'pendulum-zeal', slot: 1 })
		const url = getWeaponKeyImage(
			key,
			4,
			undefined,
			makeSeries('dark-opus'),
			{ en: 'Renunciation' }
		)
		expect(url).toBe('/images/weapon-keys/pendulum-zeal-magna-4.png')
	})

	it('does not add opus suffix for non-matching slugs', () => {
		const key = makeKey({ slug: 'alpha', slot: 1 })
		const url = getWeaponKeyImage(key, 2, undefined, makeSeries('dark-opus'), { en: 'Repudiation' })
		expect(url).toBe('/images/weapon-keys/alpha.png')
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
		const keys = [makeKey({ slug: 'alpha' }), makeKey({ slug: 'beta', name: { en: 'Beta', ja: 'ベータ' } })]
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

	it('handles array proficiency (takes first)', () => {
		const keys = [makeKey({ slug: 'strife', slot: 0 })]
		const result = getWeaponKeyImages(keys, undefined, [1, 2], makeSeries('ultima'))
		expect(result[0]!.url).toContain('strife-1')
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
		] as any
		const result = getAxSkillImages(ax)
		expect(result).toHaveLength(1)
		expect(result[0]!.url).toContain('might')
		expect(result[0]!.alt).toBe('Might')
	})

	it('filters out skills without modifier slug', () => {
		const ax = [
			{ modifier: { slug: 'might', nameEn: 'Might' }, strength: 3 },
			{ modifier: { slug: '', nameEn: '' }, strength: 1 }
		] as any
		expect(getAxSkillImages(ax)).toHaveLength(1)
	})
})
