/**
 * Solomonis Guidebook Adapter
 *
 * The Evoking Solomonis guide effect catalogue and a run's guidebook
 * (docs/prds/evoking-solomonis-prd.md, "API contract").
 *
 * - `GET /solomonis/guide_effects`: the static catalogue.
 * - `PUT /parties/:id/guide_effects`: replaces a run's whole guidebook and
 *   returns the full party, `{ party }` (board decision D11).
 *
 * @module adapters/solomonis-guidebook
 */

import { BaseAdapter } from './base.adapter'
import { DEFAULT_ADAPTER_CONFIG } from './config'
import type { Party } from '$lib/types/api/party'
import type { GuideEffect, GuidebookEntryInput } from '$lib/types/api/solomonis'

export class SolomonisGuidebookAdapter extends BaseAdapter {
	/** All known guide effects. Static and cacheable. */
	async listGuideEffects(): Promise<GuideEffect[]> {
		const response = await this.request<{ guideEffects: GuideEffect[] }>(
			'/solomonis/guide_effects',
			{ method: 'GET' }
		)
		return response.guideEffects ?? []
	}

	/** Replaces the run's guidebook with `entries`, in order. */
	async replaceGuidebook(
		partyId: string,
		entries: GuidebookEntryInput[],
		headers?: Record<string, string>
	): Promise<Party> {
		const response = await this.request<{ party: Party }>(`/parties/${partyId}/guide_effects`, {
			method: 'PUT',
			body: { guideEffects: entries },
			headers
		})
		return response.party
	}
}

export const solomonisGuidebookAdapter = new SolomonisGuidebookAdapter(DEFAULT_ADAPTER_CONFIG)
