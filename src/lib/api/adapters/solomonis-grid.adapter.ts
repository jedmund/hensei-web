/**
 * Evoking Solomonis grid writes that don't fit the existing grid endpoints.
 *
 * Seal state and `brought_by_blessing` go through the normal grid item
 * updates (`gridAdapter.updateWeapon` / `updateSummon` / `updateCharacter`).
 * The unseal priority list is written as a whole here.
 */
import type { Party } from '$lib/types/api/party'
import type { UnsealPriorityItem } from '$lib/types/api/solomonis'
import { BaseAdapter } from './base.adapter'
import { DEFAULT_ADAPTER_CONFIG } from './config'

export class SolomonisGridAdapter extends BaseAdapter {
	/**
	 * Replaces a build's unseal priority list, in order. The API renumbers
	 * from 1 and returns the full party (decisions.md D11).
	 */
	async updateUnsealPriority(
		partyId: string,
		items: UnsealPriorityItem[],
		headers?: Record<string, string>
	): Promise<Party> {
		const response = await this.request<{ party: Party }>(
			`/parties/${encodeURIComponent(partyId)}/unseal_priority`,
			{
				method: 'PUT',
				body: { items },
				...(headers ? { headers } : {})
			}
		)
		return response.party
	}
}

export const solomonisGridAdapter = new SolomonisGridAdapter(DEFAULT_ADAPTER_CONFIG)
