import { BaseAdapter } from './base.adapter'
import { DEFAULT_ADAPTER_CONFIG } from './config'
import type { RequestOptions } from './types'

/** The stored banner the gacha simulator's "current" mode uses */
export interface RefreshBanner {
	gameId: string
	name: string | null
	startsAt: string
	endsAt: string
	fetchedAt: string
	live: boolean
}

/** What Database > Refresh shows; every action answers with it */
export interface RefreshStatus {
	home: { cacheSeconds: number }
	gacha: {
		banner: RefreshBanner | null
		/** A re-fetch the fetcher hasn't answered yet */
		refetchRequestedAt: string | null
	}
}

/** Curators' refreshes of Home and the gacha rate-ups (`/admin/refreshes`) */
export class RefreshAdapter extends BaseAdapter {
	async status(options?: RequestOptions): Promise<RefreshStatus> {
		return this.request<RefreshStatus>('/admin/refreshes', options)
	}

	/** Home rebuilds on its next request */
	async refreshHome(options?: RequestOptions): Promise<RefreshStatus> {
		return this.request<RefreshStatus>('/admin/refreshes/home', { ...options, method: 'POST' })
	}

	/** Reloads the gacha catalogue and asks the fetcher to read the game's banner again */
	async refreshGacha(options?: RequestOptions): Promise<RefreshStatus> {
		return this.request<RefreshStatus>('/admin/refreshes/gacha', { ...options, method: 'POST' })
	}
}

export const refreshAdapter = new RefreshAdapter(DEFAULT_ADAPTER_CONFIG)
