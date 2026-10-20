/**
 * Featured Party Adapter
 *
 * Staff picks: editor-chosen teams, optionally tied to an event.
 *
 * @module adapters/featuredParty
 */

import { BaseAdapter } from './base.adapter'
import { DEFAULT_ADAPTER_CONFIG } from './config'
import type { RequestOptions } from './types'
import type { FeaturedParty, FeaturedPartyPayload } from '$lib/types/api/featuredParty'

const BASE = '/featured_parties'

export class FeaturedPartyAdapter extends BaseAdapter {
	/**
	 * Lists staff picks for an event.
	 *
	 * Not in the first-pass contract, which only defines writes. This assumes
	 * `GET /featured_parties?event_id=` returns `{ featured_parties: [...] }`.
	 */
	async listFeaturedParties(
		params: { eventId?: string } = {},
		options?: RequestOptions
	): Promise<FeaturedParty[]> {
		const response = await this.request<{ featuredParties: FeaturedParty[] }>(BASE, {
			...options,
			query: params.eventId ? { eventId: params.eventId } : undefined
		})
		return response.featuredParties
	}

	async createFeaturedParty(
		payload: FeaturedPartyPayload,
		options?: RequestOptions
	): Promise<FeaturedParty> {
		return this.request<FeaturedParty>(BASE, {
			...options,
			method: 'POST',
			body: { featuredParty: payload }
		})
	}

	async updateFeaturedParty(
		id: string,
		payload: Partial<FeaturedPartyPayload>,
		options?: RequestOptions
	): Promise<FeaturedParty> {
		return this.request<FeaturedParty>(`${BASE}/${id}`, {
			...options,
			method: 'PUT',
			body: { featuredParty: payload }
		})
	}

	async deleteFeaturedParty(id: string, options?: RequestOptions): Promise<void> {
		return this.request<void>(`${BASE}/${id}`, { ...options, method: 'DELETE' })
	}
}

export const featuredPartyAdapter = new FeaturedPartyAdapter(DEFAULT_ADAPTER_CONFIG)
