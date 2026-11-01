/**
 * Featured Party Adapter
 *
 * Staff picks: teams chosen by curators and editors, optionally tied to an
 * event.
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
	 * Lists staff picks, ordered by position: all of them, one event's
	 * (`eventId`), one team's (`partyId`), or both filters together.
	 */
	async listFeaturedParties(
		params: { eventId?: string | undefined; partyId?: string | undefined } = {},
		options?: RequestOptions
	): Promise<FeaturedParty[]> {
		const query: Record<string, string> = {}
		if (params.eventId) query.eventId = params.eventId
		if (params.partyId) query.partyId = params.partyId
		const response = await this.request<{ featuredParties: FeaturedParty[] }>(BASE, {
			...options,
			query: Object.keys(query).length > 0 ? query : undefined
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
