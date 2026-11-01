import { afterEach, describe, it, expect, vi } from 'vitest'
import {
	ANIMATION_KEY,
	drawAnimation,
	keepsLinkSettings,
	newSummonIdentities,
	readAnimationPreference,
	writeAnimationPreference
} from '../animation'
import { SHARE_DEFAULTS } from '$lib/utils/gachaShare'
import type { CatalogueItem } from '$lib/types/gacha'

const summon = (identity: string, drawable_id: string) =>
	({
		identity,
		drawable_id,
		drawable_type: 'Summon',
		rarity: 3,
		promotions: []
	}) as unknown as CatalogueItem
const weapon = (identity: string) =>
	({
		identity,
		drawable_id: identity,
		drawable_type: 'Weapon',
		rarity: 1,
		promotions: []
	}) as unknown as CatalogueItem

function memoryStorage(): Storage {
	const values = new Map<string, string>()
	return {
		getItem: (key) => values.get(key) ?? null,
		setItem: (key, value) => void values.set(key, value),
		removeItem: (key) => void values.delete(key),
		clear: () => values.clear(),
		key: () => null,
		get length() {
			return values.size
		}
	}
}

afterEach(() => {
	vi.unstubAllGlobals()
})

describe('newSummonIdentities', () => {
	it('is the drawn summons the viewer doesn’t have', () => {
		const drawn = [summon('Summon:1', 's1'), summon('Summon:2', 's2'), weapon('Weapon:3')]
		expect(newSummonIdentities(drawn, new Set(['s1']))).toEqual(new Set(['Summon:2']))
	})

	it('is empty while the viewer’s summons are unknown', () => {
		expect(newSummonIdentities([summon('Summon:1', 's1')], undefined).size).toBe(0)
	})
})

describe('drawAnimation', () => {
	it('is null for a draw with nothing in order', () => {
		expect(drawAnimation([], 'seed', undefined, undefined)).toBeNull()
	})

	it('keeps the drawn items with a moon each', () => {
		const drawn = [weapon('Weapon:1'), weapon('Weapon:2')]
		const animation = drawAnimation(drawn, 'seed', undefined, undefined)
		expect(animation?.items).toBe(drawn)
		expect(animation?.moons).toHaveLength(2)
		expect(animation?.presentation).toBeDefined()
	})
})

describe('keepsLinkSettings', () => {
	it('applies on a fresh visit', () => {
		expect(keepsLinkSettings('', { ...SHARE_DEFAULTS })).toBe(true)
	})

	it('applies to links for one purchase', () => {
		expect(keepsLinkSettings('?draws=10', { ...SHARE_DEFAULTS, draws: '10' })).toBe(true)
		expect(
			keepsLinkSettings('?purchase=singles&draws=1', {
				...SHARE_DEFAULTS,
				purchase: 'singles',
				draws: '1'
			})
		).toBe(true)
	})

	it('keeps other links’ settings', () => {
		expect(keepsLinkSettings('?pool=legend', { ...SHARE_DEFAULTS, mode: 'legend' })).toBe(false)
	})
})

describe('animation preference', () => {
	it('round-trips through storage', () => {
		const storage = memoryStorage()
		vi.stubGlobal('localStorage', storage)
		expect(readAnimationPreference()).toBe(false)
		writeAnimationPreference(true)
		expect(storage.getItem(ANIMATION_KEY)).toBe('1')
		expect(readAnimationPreference()).toBe(true)
		writeAnimationPreference(false)
		expect(readAnimationPreference()).toBe(false)
	})

	it('is off, and saving is a no-op, without storage', () => {
		const broken = {
			getItem: () => {
				throw new Error('denied')
			},
			setItem: () => {
				throw new Error('denied')
			}
		}
		vi.stubGlobal('localStorage', broken)
		expect(readAnimationPreference()).toBe(false)
		expect(() => writeAnimationPreference(true)).not.toThrow()
	})
})
