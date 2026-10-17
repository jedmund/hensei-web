import { describe, it, expect } from 'vitest'
import {
	nextStickerAction,
	stickerAfter,
	canShowStickerPicker,
	findSticker,
	pickerStickers,
	withMySticker
} from '../stickers'
import type { Sticker } from '$lib/types/api/sticker'

function sticker(slug: string, position: number, active = true): Sticker {
	return { id: slug, slug, meaning: { en: slug, ja: slug }, imageUrl: null, position, active }
}

describe('nextStickerAction', () => {
	it('gives when the user has no sticker', () => {
		expect(nextStickerAction(null, 'fast')).toEqual({ type: 'give', slug: 'fast' })
		expect(nextStickerAction(undefined, 'fast')).toEqual({ type: 'give', slug: 'fast' })
	})

	it('removes when the same sticker is picked again', () => {
		expect(nextStickerAction('fast', 'fast')).toEqual({ type: 'remove', slug: 'fast' })
	})

	it('swaps when another sticker is picked', () => {
		expect(nextStickerAction('fast', 'cleared')).toEqual({
			type: 'swap',
			from: 'fast',
			slug: 'cleared'
		})
	})

	it('stickerAfter gives the resulting sticker', () => {
		expect(stickerAfter({ type: 'give', slug: 'a' })).toBe('a')
		expect(stickerAfter({ type: 'swap', from: 'a', slug: 'b' })).toBe('b')
		expect(stickerAfter({ type: 'remove', slug: 'a' })).toBeNull()
	})
})

describe('canShowStickerPicker', () => {
	const party = { id: 'p1', user: { id: 'owner' } as never, visibility: 1 as const }

	it('shows on someone else’s public team', () => {
		expect(canShowStickerPicker(party, 'viewer')).toBe(true)
	})

	it('shows to signed-out viewers (they get the sign-in prompt)', () => {
		expect(canShowStickerPicker(party, null)).toBe(true)
	})

	it('hides on the viewer’s own team', () => {
		expect(canShowStickerPicker(party, 'owner')).toBe(false)
	})

	it('shows on teams without an owner account', () => {
		expect(canShowStickerPicker({ id: 'p1', visibility: 1 }, 'viewer')).toBe(true)
	})

	it('hides on unlisted, private and unsaved teams', () => {
		expect(canShowStickerPicker({ ...party, visibility: 2 }, 'viewer')).toBe(false)
		expect(canShowStickerPicker({ ...party, visibility: 3 }, 'viewer')).toBe(false)
		expect(canShowStickerPicker({ ...party, id: 'new' }, 'viewer')).toBe(false)
	})

	it('treats a missing visibility (list views) as public', () => {
		expect(canShowStickerPicker({ id: 'p1' }, 'viewer')).toBe(true)
	})
})

describe('catalogue helpers', () => {
	const catalogue = [sticker('b', 2), sticker('a', 1), sticker('off', 0, false)]

	it('pickerStickers keeps active stickers in position order', () => {
		expect(pickerStickers(catalogue).map((s) => s.slug)).toEqual(['a', 'b'])
		expect(pickerStickers(undefined)).toEqual([])
	})

	it('findSticker looks up by slug', () => {
		expect(findSticker(catalogue, 'b')?.position).toBe(2)
		expect(findSticker(catalogue, 'missing')).toBeUndefined()
		expect(findSticker(catalogue, null)).toBeUndefined()
	})

	it('withMySticker only changes the matching party', () => {
		const p = { id: 'p1', mySticker: null }
		expect(withMySticker(p, 'p1', 'a')).toEqual({ id: 'p1', mySticker: 'a' })
		expect(withMySticker(p, 'p2', 'a')).toBe(p)
	})
})
