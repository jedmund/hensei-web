/**
 * Bullet Adapter
 *
 * Gunslinger bullets: listing, editor CRUD and image downloads.
 *
 * @module adapters/bullet
 */

import { BaseAdapter } from './base.adapter'
import { DEFAULT_ADAPTER_CONFIG } from './config'
import type { Bullet } from '$lib/types/api/entities'

export interface BulletPayload {
	name_en: string
	name_jp?: string
	effect_en?: string
	effect_jp?: string
	granblue_id?: string
	slug: string
	bullet_type: number
	atk?: number
	hits_all?: boolean
	order?: number
}

/**
 * Adapter for bullets
 */
export class BulletAdapter extends BaseAdapter {
	/**
	 * Gets all bullets, optionally filtered by bullet type
	 * @param bulletType - Optional filter: 1=Parabellum, 2=Rifle, 3=Cartridge, 4=Aetherial
	 */
	async getBullets(bulletType?: number): Promise<Bullet[]> {
		const searchParams = new URLSearchParams()
		if (bulletType !== undefined) searchParams.set('bullet_type', String(bulletType))

		const queryString = searchParams.toString()
		const url = queryString ? `/bullets?${queryString}` : '/bullets'

		const response = await this.request<{ bullets: Bullet[] }>(url)
		return response.bullets
	}

	async getBulletById(id: string): Promise<Bullet> {
		return this.request<Bullet>(`/bullets/${id}`)
	}

	async createBullet(data: BulletPayload): Promise<Bullet> {
		const response = await this.request<Bullet>('/bullets', {
			method: 'POST',
			body: data
		})
		this.clearCache('/bullets')
		return response
	}

	async updateBullet(id: string, data: Partial<BulletPayload>): Promise<Bullet> {
		const response = await this.request<Bullet>(`/bullets/${id}`, {
			method: 'PUT',
			body: data
		})
		this.clearCache('/bullets')
		this.clearCache(`/bullets/${id}`)
		return response
	}

	async deleteBullet(id: string): Promise<void> {
		await this.request(`/bullets/${id}`, {
			method: 'DELETE'
		})
		this.clearCache('/bullets')
	}

	async downloadBulletImage(
		bulletId: string,
		size: string,
		force?: boolean
	): Promise<{ success: boolean; error?: string }> {
		return this.request(`/bullets/${bulletId}/download_image`, {
			method: 'POST',
			body: JSON.stringify({ size, force: force ?? false })
		})
	}

	async downloadBulletImages(
		bulletId: string,
		options?: { force?: boolean; size?: 'all' | string }
	): Promise<{ status: string; bulletId: string; message: string }> {
		return this.request(`/bullets/${bulletId}/download_images`, {
			method: 'POST',
			body: JSON.stringify({ options: options ?? {} })
		})
	}

	async getBulletDownloadStatus(
		bulletId: string
	): Promise<{ status: string; progress?: number; error?: string }> {
		return this.request(`/bullets/${bulletId}/download_status`)
	}
}

export const bulletAdapter = new BulletAdapter(DEFAULT_ADAPTER_CONFIG)
