/**
 * Home Adapter
 *
 * The home page's sections in one call: running and upcoming events with their
 * top teams per raid, rising teams and staff picks.
 *
 * @module adapters/home
 */

import { BaseAdapter } from './base.adapter'
import { DEFAULT_ADAPTER_CONFIG } from './config'
import type { RequestOptions } from './types'
import type { HomeResponse } from '$lib/types/api/home'

export class HomeAdapter extends BaseAdapter {
	async getHome(options?: RequestOptions): Promise<HomeResponse> {
		return this.request<HomeResponse>('/home', options)
	}
}

export const homeAdapter = new HomeAdapter(DEFAULT_ADAPTER_CONFIG)
