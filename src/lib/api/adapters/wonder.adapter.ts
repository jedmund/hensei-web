/**
 * Wonders Adapter
 *
 * The Wonder catalogue, a user's collected Wonders and a party's snapshotted Wonders. Contract: GBF-282.
 *
 * @module adapters/wonder
 */

import { BaseAdapter } from './base.adapter'
import type { AdapterOptions, RequestOptions } from './types'
import { DEFAULT_ADAPTER_CONFIG } from './config'
import type {
	CollectionWonderInput,
	CollectionWonderUpdate,
	OwnedWonder,
	PartyWonderInput,
	WonderCatalogue
} from '$lib/types/api/wonder'

export class WonderAdapter extends BaseAdapter {
	constructor(options?: AdapterOptions) {
		super(options)
	}

	/** `GET /wonders`: categories and Wonders with effects, level bonuses and caps. Public. */
	async getCatalogue(options?: RequestOptions): Promise<WonderCatalogue> {
		return this.request<WonderCatalogue>('/wonders', options)
	}

	/** A user's Wonders. Privacy is enforced server-side (403 when not viewable). */
	async listCollection(userId: string, options?: RequestOptions): Promise<OwnedWonder[]> {
		const response = await this.request<{ wonders: OwnedWonder[] }>(
			`/users/${userId}/collection/wonders`,
			options
		)
		return response.wonders ?? []
	}

	/** Adds a Wonder to the current user's collection. */
	async addToCollection(input: CollectionWonderInput): Promise<OwnedWonder> {
		return this.request<OwnedWonder>('/collection/wonders', {
			method: 'POST',
			body: { collectionWonder: input }
		})
	}

	/** Updates one of the current user's Wonders. */
	async updateInCollection(id: string, input: CollectionWonderUpdate): Promise<OwnedWonder> {
		return this.request<OwnedWonder>(`/collection/wonders/${id}`, {
			method: 'PUT',
			body: { collectionWonder: input }
		})
	}

	/** Removes one of the current user's Wonders. */
	async removeFromCollection(id: string): Promise<void> {
		return this.request<void>(`/collection/wonders/${id}`, { method: 'DELETE' })
	}

	/**
	 * Replaces a party's Wonders with `wonders`.
	 * @param partyId - the party's UUID
	 */
	async updatePartyWonders(
		partyId: string,
		wonders: PartyWonderInput[],
		headers?: Record<string, string>
	): Promise<OwnedWonder[]> {
		const response = await this.request<{ wonders: OwnedWonder[] }>(`/parties/${partyId}/wonders`, {
			method: 'PUT',
			body: { wonders },
			headers
		})
		return response.wonders ?? []
	}
}

export const wonderAdapter = new WonderAdapter(DEFAULT_ADAPTER_CONFIG)
