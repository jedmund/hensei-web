/**
 * Grid Sync Adapter
 *
 * Syncs grid items with their linked collection entries in both directions,
 * syncs a whole party, and unlinks a party from its collection source.
 *
 * @module adapters/gridSync
 */

import { BaseAdapter } from './base.adapter'
import { DEFAULT_ADAPTER_CONFIG } from './config'
import type { Party, GridWeapon, GridCharacter, GridSummon } from '$lib/types/api/party'

/**
 * Response from syncing all party items
 */
export interface SyncAllPartyItemsResponse {
	party: Party
	synced: {
		characters: number
		weapons: number
		summons: number
		artifacts: number
	}
}

/**
 * Grid sync adapter for linking grid items to collection entries
 */
export class GridSyncAdapter extends BaseAdapter {
	/**
	 * Syncs a grid character from its linked collection source. When `fields` is
	 * provided, only those camelCase fields (e.g. ['uncapLevel', 'overMastery.1'])
	 * are copied; omitting it syncs every tracked field.
	 */
	async syncCharacter(
		id: string,
		headers?: Record<string, string>,
		fields?: string[]
	): Promise<GridCharacter> {
		const response = await this.request<{ gridCharacter: GridCharacter }>(
			`/grid_characters/${id}/sync`,
			{
				method: 'POST',
				body: fields && fields.length > 0 ? { fields } : undefined,
				headers
			}
		)
		return response.gridCharacter
	}

	/**
	 * Syncs a grid weapon from its linked collection source. See `syncCharacter`
	 * for the `fields` parameter semantics.
	 */
	async syncWeapon(
		id: string,
		headers?: Record<string, string>,
		fields?: string[]
	): Promise<GridWeapon> {
		const response = await this.request<{ gridWeapon: GridWeapon }>(`/grid_weapons/${id}/sync`, {
			method: 'POST',
			body: fields && fields.length > 0 ? { fields } : undefined,
			headers
		})
		return response.gridWeapon
	}

	/**
	 * Syncs a grid summon from its linked collection source. See `syncCharacter`
	 * for the `fields` parameter semantics.
	 */
	async syncSummon(
		id: string,
		headers?: Record<string, string>,
		fields?: string[]
	): Promise<GridSummon> {
		const response = await this.request<{ gridSummon: GridSummon }>(`/grid_summons/${id}/sync`, {
			method: 'POST',
			body: fields && fields.length > 0 ? { fields } : undefined,
			headers
		})
		return response.gridSummon
	}

	// Sync to collection operations

	/**
	 * Syncs a grid character's data to its linked collection entry. See
	 * `syncCharacter` for the `fields` parameter semantics.
	 */
	async syncCharacterToCollection(
		id: string,
		headers?: Record<string, string>,
		fields?: string[]
	): Promise<GridCharacter> {
		const response = await this.request<{ gridCharacter: GridCharacter }>(
			`/grid_characters/${id}/sync_to_collection`,
			{
				method: 'POST',
				body: fields && fields.length > 0 ? { fields } : undefined,
				headers
			}
		)
		return response.gridCharacter
	}

	/**
	 * Syncs a grid weapon's data to its linked collection entry. See
	 * `syncCharacter` for the `fields` parameter semantics.
	 */
	async syncWeaponToCollection(
		id: string,
		headers?: Record<string, string>,
		fields?: string[]
	): Promise<GridWeapon> {
		const response = await this.request<{ gridWeapon: GridWeapon }>(
			`/grid_weapons/${id}/sync_to_collection`,
			{
				method: 'POST',
				body: fields && fields.length > 0 ? { fields } : undefined,
				headers
			}
		)
		return response.gridWeapon
	}

	/**
	 * Syncs a grid summon's data to its linked collection entry. See
	 * `syncCharacter` for the `fields` parameter semantics.
	 */
	async syncSummonToCollection(
		id: string,
		headers?: Record<string, string>,
		fields?: string[]
	): Promise<GridSummon> {
		const response = await this.request<{ gridSummon: GridSummon }>(
			`/grid_summons/${id}/sync_to_collection`,
			{
				method: 'POST',
				body: fields && fields.length > 0 ? { fields } : undefined,
				headers
			}
		)
		return response.gridSummon
	}

	/**
	 * Syncs all linked items in a party from their collection sources
	 */
	async syncAllPartyItems(
		partyId: string,
		headers?: Record<string, string>
	): Promise<SyncAllPartyItemsResponse> {
		return this.request<SyncAllPartyItemsResponse>(`/parties/${partyId}/sync_all`, {
			method: 'POST',
			headers
		})
	}

	/**
	 * Unlinks all collection items from a party's grid items.
	 * Keeps the grid items but removes their collection references and clears the collection source.
	 */
	async unlinkCollectionSource(
		partyId: string,
		headers?: Record<string, string>
	): Promise<{ party: Party }> {
		return this.request<{ party: Party }>(`/parties/${partyId}/unlink_collection`, {
			method: 'POST',
			headers
		})
	}
}

/**
 * Default grid sync adapter instance
 */
export const gridSyncAdapter = new GridSyncAdapter(DEFAULT_ADAPTER_CONFIG)
