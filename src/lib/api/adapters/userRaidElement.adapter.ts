/**
 * User Raid Element Adapter
 *
 * Which elements a user has teams for in each trackable raid. Users edit only
 * their own; crewmates can read each other's.
 *
 * @module adapters/userRaidElement
 */

import { BaseAdapter } from './base.adapter'
import { DEFAULT_ADAPTER_CONFIG } from './config'
import type { RequestOptions } from './types'
import type { UserRaidElement } from '$lib/types/api/userRaidElement'

export class UserRaidElementAdapter extends BaseAdapter {
	/** The current user's elements, grouped by raid */
	async getMine(options?: RequestOptions): Promise<UserRaidElement[]> {
		return this.request<UserRaidElement[]>('/user_raid_elements', options)
	}

	/** A user's elements by username: yourself or a crewmate */
	async getForUser(username: string, options?: RequestOptions): Promise<UserRaidElement[]> {
		return this.request<UserRaidElement[]>(
			`/users/${encodeURIComponent(username)}/raid_elements`,
			options
		)
	}

	/** Replaces the current user's elements for one raid */
	async sync(
		raidId: string,
		elements: number[],
		options?: RequestOptions
	): Promise<UserRaidElement[]> {
		return this.request<UserRaidElement[]>('/user_raid_elements/sync', {
			...options,
			method: 'PUT',
			body: { raidId, elements }
		})
	}
}

export const userRaidElementAdapter = new UserRaidElementAdapter(DEFAULT_ADAPTER_CONFIG)
