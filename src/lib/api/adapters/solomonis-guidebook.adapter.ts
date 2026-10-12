/**
 * Solomonis Guidebook Adapter
 *
 * The Evoking Solomonis guide effect catalogue and a run's guidebook
 * (docs/prds/evoking-solomonis-prd.md, "API contract").
 *
 * - `GET /solomonis/guide_effects`: the static catalogue.
 * - `PUT /parties/:id/guide_effects`: replaces a run's whole guidebook and
 *   returns the party's full `solomonis` object.
 *
 * @module adapters/solomonis-guidebook
 */

import { BaseAdapter } from './base.adapter'
import { DEFAULT_ADAPTER_CONFIG } from './config'
import type {
	GuideEffect,
	GuidebookEntryInput,
	SolomonisExpedition
} from '$lib/types/api/solomonis'

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
	): Promise<SolomonisExpedition> {
		const response = await this.request<SolomonisExpedition | { solomonis: SolomonisExpedition }>(
			`/parties/${partyId}/guide_effects`,
			{
				method: 'PUT',
				body: { guideEffects: entries },
				headers
			}
		)
		// The contract says writes return the `solomonis` object; accept it bare
		// or wrapped in `{ solomonis }` until the endpoint exists.
		return 'solomonis' in response ? response.solomonis : response
	}
}

export const solomonisGuidebookAdapter = new SolomonisGuidebookAdapter(DEFAULT_ADAPTER_CONFIG)
