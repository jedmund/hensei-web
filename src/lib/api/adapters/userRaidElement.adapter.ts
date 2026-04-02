import { BaseAdapter } from './base.adapter'
import { DEFAULT_ADAPTER_CONFIG } from './config'
import type { RequestOptions } from './types'
import type { UserRaidElement } from '$lib/types/api/userRaidElement'

export class UserRaidElementAdapter extends BaseAdapter {
	/**
	 * Get current user's raid elements
	 */
	async getMyRaidElements(options?: RequestOptions): Promise<UserRaidElement[]> {
		return this.request<UserRaidElement[]>('/user_raid_elements', options)
	}

	/**
	 * Bulk sync elements for a specific raid
	 */
	async syncRaidElements(
		raidId: string,
		elements: number[],
		options?: RequestOptions
	): Promise<UserRaidElement[]> {
		return this.request<UserRaidElement[]>('/user_raid_elements/sync', {
			...options,
			method: 'PUT',
			body: JSON.stringify({ raid_id: raidId, elements })
		})
	}

	/**
	 * Get another user's raid elements by username
	 */
	async getUserRaidElements(
		username: string,
		options?: RequestOptions
	): Promise<UserRaidElement[]> {
		return this.request<UserRaidElement[]>(`/users/${username}/raid_elements`, options)
	}
}

export const userRaidElementAdapter = new UserRaidElementAdapter(DEFAULT_ADAPTER_CONFIG)
