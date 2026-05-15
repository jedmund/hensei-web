import type { SupportSummon, SupportSummonSection } from '$lib/types/api/supportSummon'
import { BaseAdapter } from './base.adapter'
import { DEFAULT_ADAPTER_CONFIG } from './config'
import type { RequestOptions } from './types'

export interface SupportSummonWriteParams {
	collectionSummonId: string
	section: SupportSummonSection
	position: number
}

export class SupportSummonAdapter extends BaseAdapter {
	async create(params: SupportSummonWriteParams, options?: RequestOptions): Promise<SupportSummon> {
		return await this.request<SupportSummon>('/support_summons', {
			method: 'POST',
			body: { supportSummon: params },
			...options
		})
	}

	async update(
		id: string,
		params: Partial<SupportSummonWriteParams>,
		options?: RequestOptions
	): Promise<SupportSummon> {
		return await this.request<SupportSummon>(`/support_summons/${encodeURIComponent(id)}`, {
			method: 'PATCH',
			body: { supportSummon: params },
			...options
		})
	}

	async destroy(id: string, options?: RequestOptions): Promise<void> {
		await this.request<void>(`/support_summons/${encodeURIComponent(id)}`, {
			method: 'DELETE',
			...options
		})
	}
}

export const supportSummonAdapter = new SupportSummonAdapter(DEFAULT_ADAPTER_CONFIG)
