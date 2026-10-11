import { describe, it, expect, vi } from 'vitest'

vi.mock('$lib/api/adapters/config', () => ({
	getImageBaseUrl: vi.fn(() => 'https://siero-img.s3-us-west-2.amazonaws.com')
}))

import { gachaItemCardFallbackImage, gachaItemCardImage } from '../gacha'
import type { CatalogueItem } from '$lib/types/gacha'

const BASE = 'https://siero-img.s3-us-west-2.amazonaws.com'

function item(overrides: Partial<CatalogueItem>): CatalogueItem {
	return {
		identity: 'test',
		drawable_type: 'Weapon',
		drawable_id: 'uuid',
		granblue_id: '1040515700',
		name: { en: 'Test', ja: 'テスト' },
		rarity: 4,
		element: 2,
		promotions: [],
		...overrides
	}
}

const weapon = item({})
const characterWeapon = item({
	granblue_id: '1040022300',
	category: 'characterWeapon',
	recruits: { granblue_id: '3040071000', en: 'Character', ja: 'キャラ' }
})
const summon = item({ drawable_type: 'Summon', granblue_id: '2040003000', category: 'summon' })

describe('gachaItemCardImage', () => {
	it('returns weapon gacha art', () => {
		expect(gachaItemCardImage(weapon)).toBe(`${BASE}/weapons/gacha/1040515700.png`)
	})

	it("uses a character weapon's own art, not the character's", () => {
		expect(gachaItemCardImage(characterWeapon)).toBe(`${BASE}/weapons/gacha/1040022300.png`)
	})

	it('returns summon gacha art', () => {
		expect(gachaItemCardImage(summon)).toBe(`${BASE}/summons/gacha/2040003000.png`)
	})
})

describe('gachaItemCardFallbackImage', () => {
	it('falls back to weapon base art', () => {
		expect(gachaItemCardFallbackImage(weapon)).toBe(`${BASE}/weapons/base/1040515700.png`)
		expect(gachaItemCardFallbackImage(characterWeapon)).toBe(`${BASE}/weapons/base/1040022300.png`)
	})

	it('falls back to summon detail art', () => {
		expect(gachaItemCardFallbackImage(summon)).toBe(`${BASE}/summons/detail/2040003000.png`)
	})
})
