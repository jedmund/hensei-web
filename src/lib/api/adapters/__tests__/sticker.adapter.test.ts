import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { StickerAdapter } from '../sticker.adapter'
import { mockApiResponse } from './fixtures/helpers'

const apiSticker = {
	id: 'st-1',
	slug: 'full-auto',
	meaning: { en: 'Full-auto friendly', ja: 'フルオートで使える' },
	image_url: 'https://img.example.com/icons/stickers/full-auto.png',
	position: 0,
	active: true
}

function calls() {
	return (global.fetch as ReturnType<typeof vi.fn>).mock.calls
}

describe('StickerAdapter', () => {
	let adapter: StickerAdapter
	let originalFetch: typeof global.fetch

	beforeEach(() => {
		originalFetch = global.fetch
		adapter = new StickerAdapter({ baseURL: 'https://api.example.com' })
	})

	afterEach(() => {
		global.fetch = originalFetch
	})

	it('listStickers unwraps and camelCases the catalogue', async () => {
		global.fetch = mockApiResponse({ stickers: [apiSticker] })

		const result = await adapter.listStickers()

		expect(calls()[0]![0]).toBe('https://api.example.com/stickers')
		expect(result).toEqual([
			{
				id: 'st-1',
				slug: 'full-auto',
				meaning: { en: 'Full-auto friendly', ja: 'フルオートで使える' },
				imageUrl: 'https://img.example.com/icons/stickers/full-auto.png',
				position: 0,
				active: true
			}
		])
	})

	it('listStickers asks for inactive stickers for editors', async () => {
		global.fetch = mockApiResponse({ stickers: [] })

		await adapter.listStickers({ includeInactive: true })

		expect(calls()[0]![0]).toBe('https://api.example.com/stickers?include_inactive=true')
	})

	it('createSticker POSTs the sticker envelope in snake_case', async () => {
		global.fetch = mockApiResponse(apiSticker)

		await adapter.createSticker({
			slug: 'full-auto',
			meaningEn: 'Full-auto friendly',
			meaningJp: 'フルオートで使える',
			active: true
		})

		const [url, init] = calls()[0]!
		expect(url).toBe('https://api.example.com/stickers')
		expect(init.method).toBe('POST')
		expect(JSON.parse(init.body)).toEqual({
			sticker: {
				slug: 'full-auto',
				meaning_en: 'Full-auto friendly',
				meaning_jp: 'フルオートで使える',
				active: true
			}
		})
	})

	it('updateSticker PUTs to /stickers/:id', async () => {
		global.fetch = mockApiResponse(apiSticker)

		await adapter.updateSticker('st-1', { active: false })

		const [url, init] = calls()[0]!
		expect(url).toBe('https://api.example.com/stickers/st-1')
		expect(init.method).toBe('PUT')
		expect(JSON.parse(init.body)).toEqual({ sticker: { active: false } })
	})

	it('deleteSticker surfaces the 422 when the sticker has been given', async () => {
		global.fetch = vi.fn().mockResolvedValue({
			ok: false,
			status: 422,
			statusText: 'Unprocessable Entity',
			json: async () => ({ error: 'Sticker has been given and cannot be deleted' })
		})

		await expect(adapter.deleteSticker('st-1')).rejects.toMatchObject({
			status: 422,
			message: 'Sticker has been given and cannot be deleted'
		})
		expect(calls()[0]![1].method).toBe('DELETE')
	})

	it('reorderStickers PUTs the ids', async () => {
		global.fetch = mockApiResponse({ stickers: [apiSticker] })

		const result = await adapter.reorderStickers(['st-2', 'st-1'])

		const [url, init] = calls()[0]!
		expect(url).toBe('https://api.example.com/stickers/reorder')
		expect(init.method).toBe('PUT')
		expect(JSON.parse(init.body)).toEqual({ ids: ['st-2', 'st-1'] })
		expect(result[0]?.slug).toBe('full-auto')
	})

	it('uploadImage sends multipart form data without a JSON content type', async () => {
		global.fetch = mockApiResponse(apiSticker)
		const file = new Blob(['png'], { type: 'image/png' })

		await adapter.uploadImage('st-1', file, 'full-auto.png')

		const [url, init] = calls()[0]!
		expect(url).toBe('https://api.example.com/stickers/st-1/upload_image')
		expect(init.body).toBeInstanceOf(FormData)
		expect((init.body as FormData).get('image')).toBeInstanceOf(Blob)
		expect(init.headers['Content-Type']).toBeUndefined()
	})

	it('giveSticker PUTs only the slug to the party', async () => {
		global.fetch = mockApiResponse({ sticker: 'full-auto' })

		const result = await adapter.giveSticker('party-uuid', 'full-auto')

		const [url, init] = calls()[0]!
		expect(url).toBe('https://api.example.com/parties/party-uuid/sticker')
		expect(init.method).toBe('PUT')
		expect(JSON.parse(init.body)).toEqual({ sticker: 'full-auto' })
		expect(result).toBe('full-auto')
	})

	it('removeSticker DELETEs and handles 204', async () => {
		global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 204, json: async () => null })

		await expect(adapter.removeSticker('party-uuid')).resolves.toBeUndefined()
		const [url, init] = calls()[0]!
		expect(url).toBe('https://api.example.com/parties/party-uuid/sticker')
		expect(init.method).toBe('DELETE')
	})
})
