/**
 * Evoking Solomonis Adapter
 *
 * Catalogues (route Evokers, Arcarum Blessings) and the party-level
 * Solomonis writes: the expedition fields sent as `party[solomonis]` on party
 * create/update, and the blessing loadout. Seal state, unseal priority and the
 * run guidebook live in the web-grid and web-guidebook lanes' adapters.
 *
 * Contract: docs/prds/evoking-solomonis-prd.md ("API contract").
 *
 * @module adapters/solomonis
 */

import { BaseAdapter } from './base.adapter'
import type { AdapterOptions, RequestOptions } from './types'
import { DEFAULT_ADAPTER_CONFIG } from './config'
import type { CreatePartyParams } from './party.adapter'
import type { Party } from '$lib/types/api/party'
import type {
	ArcarumBlessing,
	RouteEvoker,
	SolomonisExpeditionInput
} from '$lib/types/api/solomonis'

/** `GET /solomonis/blessings` */
export interface BlessingCatalogue {
	costLimit: number
	blessings: ArcarumBlessing[]
}

export class SolomonisAdapter extends BaseAdapter {
	constructor(options?: AdapterOptions) {
		super(options)
	}

	/** Route-eligible Evokers with their zone. Static and cacheable. */
	async getRouteEvokers(options?: RequestOptions): Promise<RouteEvoker[]> {
		const response = await this.request<{ routeEvokers: RouteEvoker[] }>(
			'/solomonis/route_evokers',
			options
		)
		return response.routeEvokers
	}

	/** Blessing catalogue with levels and the loadout cost limit. Static and cacheable. */
	async getBlessings(options?: RequestOptions): Promise<BlessingCatalogue> {
		return this.request<BlessingCatalogue>('/solomonis/blessings', options)
	}

	/** Creates a party together with its expedition (`party[solomonis]`). */
	async createParty(
		params: CreatePartyParams,
		solomonis: SolomonisExpeditionInput,
		headers?: Record<string, string>
	): Promise<Party> {
		const response = await this.request<{ party: Party }>('/parties', {
			method: 'POST',
			body: { party: { ...params, solomonis } },
			headers
		})
		return response.party
	}

	/**
	 * Updates a party's expedition fields. Setting `routeEvokerId` also moves
	 * the party to that Evoker's zone and element on the API side.
	 * @param partyId - the party's UUID (the API updates by id, not shortcode)
	 */
	async updateExpedition(
		partyId: string,
		solomonis: SolomonisExpeditionInput,
		headers?: Record<string, string>
	): Promise<Party> {
		const response = await this.request<{ party: Party }>(`/parties/${partyId}`, {
			method: 'PUT',
			body: { party: { solomonis } },
			headers
		})
		return response.party
	}

	/**
	 * Replaces the party's blessing loadout. One level per blessing; the API
	 * rejects unreleased blessings and totals over the cost limit with a 422.
	 * Returns the full party (D11): Justice can change the starting slots.
	 */
	async updateBlessings(
		partyId: string,
		blessingLevelIds: string[],
		headers?: Record<string, string>
	): Promise<Party> {
		const response = await this.request<{ party: Party }>(`/parties/${partyId}/blessings`, {
			method: 'PUT',
			body: { blessingLevelIds },
			headers
		})
		return response.party
	}
}

export const solomonisAdapter = new SolomonisAdapter(DEFAULT_ADAPTER_CONFIG)
