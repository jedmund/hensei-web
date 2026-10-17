/**
 * Sticker Adapter
 *
 * The sticker catalogue (public list, editor CRUD, image upload, reorder) and
 * giving a sticker to a party. Givers are anonymous; the API never exposes
 * who gave what.
 *
 * @module adapters/sticker
 */

import { BaseAdapter } from './base.adapter'
import { DEFAULT_ADAPTER_CONFIG } from './config'
import type { RequestOptions } from './types'
import type { Sticker, StickerPayload } from '$lib/types/api/sticker'

const BASE = '/stickers'

export class StickerAdapter extends BaseAdapter {
	/**
	 * Lists stickers, ordered by position. Public callers get active stickers
	 * only; editors may pass `includeInactive` to get the whole catalogue.
	 */
	async listStickers(
		params: { includeInactive?: boolean } = {},
		options?: RequestOptions
	): Promise<Sticker[]> {
		const response = await this.request<{ stickers: Sticker[] }>(BASE, {
			...options,
			query: params.includeInactive ? { includeInactive: true } : undefined
		})
		return response.stickers
	}

	async createSticker(payload: StickerPayload, options?: RequestOptions): Promise<Sticker> {
		return this.request<Sticker>(BASE, {
			...options,
			method: 'POST',
			body: { sticker: payload }
		})
	}

	async updateSticker(
		id: string,
		payload: Partial<StickerPayload>,
		options?: RequestOptions
	): Promise<Sticker> {
		return this.request<Sticker>(`${BASE}/${id}`, {
			...options,
			method: 'PUT',
			body: { sticker: payload }
		})
	}

	/** Rejected with a 422 once anyone has given the sticker */
	async deleteSticker(id: string, options?: RequestOptions): Promise<void> {
		return this.request<void>(`${BASE}/${id}`, { ...options, method: 'DELETE' })
	}

	/** Uploads a PNG or WebP as the multipart field `image` */
	async uploadImage(id: string, file: Blob, filename?: string): Promise<Sticker> {
		const form = new FormData()
		if (filename) form.append('image', file, filename)
		else form.append('image', file)
		return this.request<Sticker>(`${BASE}/${id}/upload_image`, {
			method: 'POST',
			body: form
		})
	}

	async reorderStickers(ids: string[], options?: RequestOptions): Promise<Sticker[]> {
		const response = await this.request<{ stickers: Sticker[] }>(`${BASE}/reorder`, {
			...options,
			method: 'PUT',
			body: { ids }
		})
		return response.stickers
	}

	/** Gives the current user's sticker to a party, replacing any earlier one */
	async giveSticker(partyId: string, slug: string, options?: RequestOptions): Promise<string> {
		const response = await this.request<{ sticker: string }>(`/parties/${partyId}/sticker`, {
			...options,
			method: 'PUT',
			body: { sticker: slug }
		})
		return response.sticker
	}

	/** Removes the current user's sticker from a party (no-op if none) */
	async removeSticker(partyId: string, options?: RequestOptions): Promise<void> {
		return this.request<void>(`/parties/${partyId}/sticker`, { ...options, method: 'DELETE' })
	}
}

export const stickerAdapter = new StickerAdapter(DEFAULT_ADAPTER_CONFIG)
